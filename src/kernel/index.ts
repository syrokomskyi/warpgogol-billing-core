/*
<MODULE_CONTRACT>
<purpose>Expose the billing kernel module and its store resolver type.</purpose>
<non-goals><item>Do not construct store adapters or execute commands from this barrel.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: export the billing kernel module.</item></CHANGE_SUMMARY>
*/

export { createBillingKernelModule, billingKernelModule, type BillingStoreResolver } from "../kernel-module.ts";
