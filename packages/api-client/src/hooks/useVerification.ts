import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../client';
import type {
  VerificationResult,
  VerificationRequest,
  VerificationStatus,
  VerificationMethod,
  MRVAssessment,
  EvidenceProcessingResult,
  BatchVerificationRequest,
  BatchStatusRequest,
  BatchStatusResponse,
  BatchJobResponse
} from '../types/verification';

// Query Keys
export const verificationKeys = {
  all: ['verification'] as const,
  status: (liftTokenId: number) => ['verification', 'status', liftTokenId] as const,
  methods: () => ['verification', 'methods'] as const,
  result: (id: number) => ['verification', 'result', id] as const,
  mrv: (id: number) => ['verification', 'mrv', id] as const,
  batch: (batchId: string) => ['verification', 'batch', batchId] as const,
};

// Hook: Get verification status for a lift token
export function useVerificationStatus(liftTokenId: number) {
  return useQuery({
    queryKey: verificationKeys.status(liftTokenId),
    queryFn: () => client.get<VerificationStatus>(`lift-tokens/${liftTokenId}/verification-status`),
    enabled: !!liftTokenId,
    staleTime: 30 * 1000, // 30 seconds - verification status changes frequently
    refetchInterval: 5 * 1000, // Poll every 5 seconds for updates
  });
}

// Hook: Submit verification request
export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ liftTokenId, ...data }: { liftTokenId: number } & VerificationRequest) => 
      client.post<VerificationResult>(`lift-tokens/${liftTokenId}/verify`, data),
    onSuccess: (_, { liftTokenId }) => {
      // Invalidate verification status to show new submission
      queryClient.invalidateQueries({
        queryKey: verificationKeys.status(liftTokenId),
      });
    },
  });
}

// Hook: Get verification methods
export function useVerificationMethods(filters?: {
  methodologyType?: string;
  active?: boolean;
  chainId?: number;
}) {
  return useQuery({
    queryKey: [...verificationKeys.methods(), filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters?.methodologyType) searchParams.set('methodologyType', filters.methodologyType);
      if (filters?.active !== undefined) searchParams.set('active', filters.active.toString());
      if (filters?.chainId) searchParams.set('chainId', filters.chainId.toString());

      const url = `verification-methods${searchParams.toString() ? `?${searchParams}` : ''}`;
      return client.get<VerificationMethod[]>(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - methods don't change often
  });
}

// Hook: Process verification calculation
export function useProcessVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      resultId, 
      priority = 'normal',
      forceRecalculation = false 
    }: { 
      resultId: number;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      forceRecalculation?: boolean;
    }) => 
      client.post<{ jobId: string; status: string; estimatedCompletion: string }>(
        `verification-results/${resultId}/calculate`, 
        { priority, forceRecalculation }
      ),
    onSuccess: (_, { resultId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: verificationKeys.result(resultId),
      });
    },
  });
}

// Hook: Process evidence files
export function useProcessEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId: number) => 
      client.post<EvidenceProcessingResult>(`verification-results/${resultId}/process-evidence`),
    onSuccess: (_, resultId) => {
      queryClient.invalidateQueries({
        queryKey: verificationKeys.result(resultId),
      });
    },
  });
}

// Hook: Get MRV assessment
export function useMRVAssessment(resultId: number) {
  return useQuery({
    queryKey: verificationKeys.mrv(resultId),
    queryFn: () => client.get<MRVAssessment>(`verification-results/${resultId}/mrv-assessment`),
    enabled: !!resultId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook: Batch verification
export function useBatchVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchVerificationRequest) => 
      client.post<BatchJobResponse>('lift-tokens/batch/verify', data),
    onSuccess: () => {
      // Invalidate all verification queries since multiple tokens affected
      queryClient.invalidateQueries({
        queryKey: verificationKeys.all,
      });
    },
  });
}

// Hook: Batch status check
export function useBatchStatus() {
  return useMutation({
    mutationFn: (data: BatchStatusRequest) => 
      client.post<BatchStatusResponse>('lift-tokens/batch/status', data),
  });
}

// Hook: Get MRV protocols
export function useMRVProtocols() {
  return useQuery({
    queryKey: ['mrv', 'protocols'],
    queryFn: () => client.get<any[]>('mrv-protocols'),
    staleTime: 10 * 60 * 1000, // 10 minutes - protocols are stable
  });
}

// Hook: Real-time verification updates (WebSocket wrapper)
export function useVerificationUpdates(liftTokenId: number, onUpdate?: (update: any) => void) {
  const queryClient = useQueryClient();

  // This will be enhanced with WebSocket connection
  // For now, we'll use polling as a fallback
  const { data } = useVerificationStatus(liftTokenId);

  // Future: WebSocket implementation
  // useEffect(() => {
  //   const ws = new WebSocket(`${WS_URL}/verification/${liftTokenId}`);
  //   ws.onmessage = (event) => {
  //     const update = JSON.parse(event.data);
  //     onUpdate?.(update);
  //     queryClient.invalidateQueries({ queryKey: verificationKeys.status(liftTokenId) });
  //   };
  //   return () => ws.close();
  // }, [liftTokenId, onUpdate, queryClient]);

  return { data };
}

// Hook: Create verification method
export function useCreateVerificationMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<VerificationMethod, 'id' | 'createdAt' | 'updatedAt'>) => 
      client.post<VerificationMethod>('verification-methods', data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: verificationKeys.methods(),
      });
    },
  });
}