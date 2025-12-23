"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useDepartment,
  useHAPs,
  usePeople,
  useRoles,
  useDepartmentStats,
} from "@/hooks";
import {
  calculateDepartmentMetrics,
  DepartmentSummaryCards,
  DepartmentTabs,
} from "./components";

export default function DepartmentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: department, isLoading: loadingDept } = useDepartment(id);
  const { data: allHAPs = [], isLoading: loadingHAPs } = useHAPs();
  const { data: people = [] } = usePeople();
  const { data: roles = [] } = useRoles();
  const { data: stats } = useDepartmentStats(id);

  // Filter HAPs for this department
  const departmentHAPs = React.useMemo(() => {
    const deptRoleIds = roles.filter((r) => r.departmentId === id).map((r) => r.id);
    return allHAPs.filter((hap) => deptRoleIds.includes(hap.roleId));
  }, [allHAPs, roles, id]);

  const metrics = React.useMemo(
    () => calculateDepartmentMetrics(departmentHAPs),
    [departmentHAPs]
  );

  const manager = people.find((p) => p.id === department?.managerId);

  if (loadingDept || loadingHAPs) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Department not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/organization")}
            >
              Back to Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/organization">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{department.name}</h1>
          </div>
          {department.description && (
            <p className="text-muted-foreground mt-1">{department.description}</p>
          )}
        </div>
        {manager && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Manager</p>
            <p className="font-medium">{manager.name}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <DepartmentSummaryCards metrics={metrics} />

      {/* Tabs */}
      <DepartmentTabs
        metrics={metrics}
        departmentHAPs={departmentHAPs}
        people={people}
        roles={roles}
      />
    </div>
  );
}
