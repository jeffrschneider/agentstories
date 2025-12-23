import type { HumanAgentPair, CapabilityRequirement } from '@/lib/schemas';
import { calculateHAPMetrics } from '@/lib/schemas/hap';
import type { HAPState } from './hap-types';

// Create selectors factory that operates on the store
export function createHAPSelectors(hapStore: HAPState) {
  return {
    // Get filtered HAPs based on current filters
    getFilteredHAPs: (): HumanAgentPair[] => {
      let result = [...hapStore.cache.haps];

      if (hapStore.filters.departmentId) {
        const deptRoleIds = hapStore.cache.roles
          .filter(r => r.departmentId === hapStore.filters.departmentId)
          .map(r => r.id);
        result = result.filter(h => deptRoleIds.includes(h.roleId));
      }

      if (hapStore.filters.personId) {
        result = result.filter(h => h.personId === hapStore.filters.personId);
      }

      if (hapStore.filters.integrationStatus) {
        result = result.filter(h => h.integrationStatus === hapStore.filters.integrationStatus);
      }

      if (hapStore.filters.search) {
        const search = hapStore.filters.search.toLowerCase();
        result = result.filter(h => {
          const person = hapStore.cache.people.find(p => p.id === h.personId);
          const role = hapStore.cache.roles.find(r => r.id === h.roleId);
          return (
            person?.name.toLowerCase().includes(search) ||
            role?.name.toLowerCase().includes(search) ||
            h.notes?.toLowerCase().includes(search)
          );
        });
      }

      return result;
    },

    // Get stats for current view
    getIntegrationStats: () => {
      const haps = hapStore.cache.haps;
      return {
        total: haps.length,
        notStarted: haps.filter(h => h.integrationStatus === 'not_started').length,
        planning: haps.filter(h => h.integrationStatus === 'planning').length,
        skillsPending: haps.filter(h => h.integrationStatus === 'skills_pending').length,
        ready: haps.filter(h => h.integrationStatus === 'ready').length,
        active: haps.filter(h => h.integrationStatus === 'active').length,
        paused: haps.filter(h => h.integrationStatus === 'paused').length,
      };
    },

    // Get aggregate metrics across all HAPs
    getAggregateMetrics: () => {
      const haps = hapStore.cache.haps;
      let totalTasks = 0;
      let totalPhases = 0;
      let humanPhases = 0;
      let agentPhases = 0;
      let agentPhasesWithSkills = 0;
      let pendingCapabilityRequirements = 0;

      for (const hap of haps) {
        const metrics = calculateHAPMetrics(hap);
        totalTasks += metrics.totalTasks;
        totalPhases += metrics.totalPhases;
        humanPhases += metrics.humanPhases;
        agentPhases += metrics.agentPhases;
        agentPhasesWithSkills += metrics.agentPhasesWithSkills;
        pendingCapabilityRequirements += metrics.pendingCapabilityRequirements;
      }

      return {
        totalHAPs: haps.length,
        totalTasks,
        totalPhases,
        humanPhases,
        agentPhases,
        agentPhasesWithSkills,
        agentPhasesPendingSkills: agentPhases - agentPhasesWithSkills,
        pendingCapabilityRequirements,
        humanPercent: totalPhases > 0 ? Math.round((humanPhases / totalPhases) * 100) : 100,
        agentPercent: totalPhases > 0 ? Math.round((agentPhases / totalPhases) * 100) : 0,
      };
    },

    // Get all pending capability requirements across all HAPs
    getAllPendingCapabilityRequirements: (): CapabilityRequirement[] => {
      const allRequirements: CapabilityRequirement[] = [];
      for (const hap of hapStore.cache.haps) {
        const pending = hap.capabilityRequirements.filter(
          r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
        );
        allRequirements.push(...pending);
      }
      return allRequirements;
    },

    // Get draft metrics
    getDraftMetrics: () => {
      if (hapStore.draft.tasks.length === 0) {
        return {
          totalTasks: 0,
          totalPhases: 0,
          humanPhases: 0,
          agentPhases: 0,
          pendingCapabilityRequirements: hapStore.draft.capabilityRequirements.filter(
            r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
          ).length,
        };
      }

      let humanPhases = 0;
      let agentPhases = 0;

      for (const task of hapStore.draft.tasks) {
        for (const phase of Object.values(task.phases)) {
          if (phase.owner === 'human') {
            humanPhases++;
          } else {
            agentPhases++;
          }
        }
      }

      return {
        totalTasks: hapStore.draft.tasks.length,
        totalPhases: hapStore.draft.tasks.length * 4,
        humanPhases,
        agentPhases,
        pendingCapabilityRequirements: hapStore.draft.capabilityRequirements.filter(
          r => r.status === 'pending' || r.status === 'generating' || r.status === 'ready'
        ).length,
      };
    },
  };
}
