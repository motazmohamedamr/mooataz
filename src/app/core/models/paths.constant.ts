export const PATHS = {
  Home: '/',
  Page404: '/error/404',
  Page403: '/error/403',
  Page500: '/error/500',
  Login: '/auth/login',
  Signup: '/auth/register',
  Forgot: '/auth/forgot',
  Reset: '/auth/reset',
  Logout: '/logout',
  Archive: '/archive',
  Settings: '/settings',
  Users: '/users',
  TwoFA: '/auth/twoFA',
  Dashboard: '/dashboard',
};

const RETURN_URL_TYPE = 'returnUrl';
const MESSAGE_URL_TYPE = 'message';

export const QUERY_PARAMETER_NAMES = {
  ReturnUrl: RETURN_URL_TYPE,
  Message: MESSAGE_URL_TYPE,
};

export const MODALS = {
  usersCreateUpdate: 'usersCreateUpdate',
  tenantsCreateUpdate: 'tenantsCreateUpdate',
  contractTypesCreateUpdate: 'contractTypesCreateUpdate',
  measurementUnitCreateUpdate: 'measurementUnitCreateUpdate',
  materialCreateUpdate: 'materialCreateUpdate',
  clientCreateUpdate: 'clientCreateUpdate',
  countryUpdate: 'countryUpdate',
  cityUpdate: 'cityUpdate',
  ContractsCreateUpdate: 'contractCreateUpdate',
  BranchesCreateUpdate: 'branchCreateUpdate',
  CommerceChambersCreateUpdate: 'CommerceChambersCreateUpdate',
  suppliersCreateUpdate: 'suppliersCreateUpdate',
};

export const MODULES = {
  MultiTenancy: 'MultiTenancy',
  ContractTypes: 'ContractTypes',
  MeasuringUnits: 'MeasuringUnits',
  Materials: 'Materials',
  Users: 'Users',
  Countries: 'Countries',
  Cities: 'Cities',
  Clients: 'Clients',
  Branches: 'Branches',
  Suppliers: 'Suppliers',
  CommerceChambers: 'CommerceChambers',
  Banks: 'Banks',
  Contract: 'Contract',
  Projects: 'Projects',
};

export const PERMISSIONS = {
  List: 'List',
  Create: 'Create',
  Update: 'Update',
  Delete: 'Delete',
  Tenants: {
    ExtendSubscription: 'ExtendSubscription',
    ActivateTenant: 'ActivateTenant',
    DeactivateTenant: 'DeactivateTenant',
  },
  Clients: {
    ActivateClient: 'ActivateClient',
    DeactivateClient: 'DeactivateClient',
  },
  Suppliers: {
    ActivateSupplier: 'ActivateSupplier',
    DeactivateSupplier: 'DeactivateSupplier',
  },
  Users: {
    ActivateUsers: 'ActivateUsers',
    DeactivateUsers: 'DeactivateUsers',
    ResetPassword: 'ResetPassword',
    EndLockOut: 'EndLockOut',
    Reset2fa: 'ResetTwoFA',
  },
};

export function constructPermission(module: string, permission: string): string {
  if (!permission) return '';
  return `Permission_${module}_${permission}`;
}
