// Stub API client for deployment
export const useProjects = () => ({ data: [], isLoading: false });
export const useProject = () => ({ data: null, isLoading: false });
export const useCreateProject = () => ({ mutate: () => {} });
export const useProjectMetrics = () => ({ data: null, isLoading: false });
export const useProjectVerification = () => ({ data: null, isLoading: false });
export const useUpdateProjectState = () => ({ mutate: () => {} });
export const useSubmitVerification = () => ({ mutate: () => {} });
export const VWBA_EVIDENCE_TYPES = [];

// Stub types
export const Project = {};
export const VerificationMethod = {};
export const VerificationStatus = {};
export const EvidenceSubmission = {};