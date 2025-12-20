// Stories
export {
  storyKeys,
  useStories,
  useStory,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  useDuplicateStory,
  useLogExport,
} from './use-stories';

// Templates
export {
  templateKeys,
  useTemplates,
  useTemplate,
  useCreateFromTemplate,
} from './use-templates';

// Stats
export {
  statsKeys,
  useStats,
} from './use-stats';

// Keyboard shortcuts
export {
  useKeyboardShortcuts,
  useSaveShortcut,
} from './use-keyboard-shortcuts';

// Form validation
export {
  useFormValidation,
  useFieldError,
  type FieldError,
  type UseFormValidationReturn,
} from './use-form-validation';

// HAP (Human-Agent Pairs)
export {
  hapKeys,
  // Domains
  useDomains,
  useDomain,
  useCreateDomain,
  useUpdateDomain,
  useDeleteDomain,
  // Departments
  useDepartments,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  // Roles
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  // People
  usePeople,
  usePerson,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  // HAPs
  useHAPs,
  useHAPDetail,
  useCreateHAP,
  useUpdateHAP,
  useDeleteHAP,
  // Stats
  useHAPStats,
  useDepartmentStats,
} from './use-hap';
