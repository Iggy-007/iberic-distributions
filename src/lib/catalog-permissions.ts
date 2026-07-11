import { Role } from "@prisma/client";

export function canManageCatalog(role: Role): boolean {
  return role === Role.ADMIN || role === Role.PROVIDER;
}
