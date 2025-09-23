/**
 * Robust Video Jobs API Client
 * 
 * Uses Server-Sent Events and persistent job tracking for reliable video generation.
 * This replaces the fragile client-side polling system.
 */

export interface VideoJobRequest {
  prompt: string;
  aspectRatio: string;
  sceneNumber: number;
}

export interface VideoJobResponse {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  videoUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
  isExisting?: boolean;
}

export interface VideoJobUpdate {
  id: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  videoUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attemptCount: number;
  updatedAt: Date;
  type?: string; // For keepalive messages
}

const VIDEO_JOBS_BASE = "/api/video-jobs";

// Custom fetch wrapper for video jobs API
async function makeVideoJobsRequest<T>(
  method: string,
  endpoint: string,
  data?: unknown,
): Promise<T> {
  const requestInit: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method !== "GET" && data) {
    requestInit.body = JSON.stringify(data);
  }

  const response = await fetch(`${VIDEO_JOBS_BASE}${endpoint}`, requestInit);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new video generation job
 */
export async function createVideoJob(request: VideoJobRequest): Promise<VideoJobResponse> {
  console.log('Creating video job:', request);
  return makeVideoJobsRequest<VideoJobResponse>("POST", "", request);
}

/**
 * Get job status by ID
 */
export async function getVideoJob(jobId: number): Promise<VideoJobResponse> {
  return makeVideoJobsRequest<VideoJobResponse>("GET", `/${jobId}`);
}

/**
 * Get list of user's jobs
 */
export async function getUserVideoJobs(): Promise<{ jobs: VideoJobResponse[] }> {
  return makeVideoJobsRequest<{ jobs: VideoJobResponse[] }>("GET", "");
}

/**
 * Subscribe to real-time job updates using Server-Sent Events
 */
export function subscribeToJobUpdates(
  jobId: number,
  onUpdate: (update: VideoJobUpdate) => void,
  onError: (error: Error) => void,
): () => void {
  console.log(`Subscribing to job updates for job ${jobId}`);
  
  const eventSource = new EventSource(`${VIDEO_JOBS_BASE}/${jobId}/stream`, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    try {
      const update = JSON.parse(event.data) as VideoJobUpdate;
      
      // Skip keepalive messages
      if (update.type === 'keepalive') {
        return;
      }
      
      console.log(`Job ${jobId} update:`, update);
      onUpdate(update);
      
      // Close connection if job is complete
      if (update.status === 'completed' || update.status === 'failed' || update.status === 'expired') {
        console.log(`Job ${jobId} reached terminal state: ${update.status}`);
        eventSource.close();
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
      onError(new Error('Failed to parse server update'));
    }
  };

  eventSource.onerror = (event) => {
    console.error(`SSE error for job ${jobId}:`, event);
    onError(new Error('Connection to server lost'));
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    console.log(`Unsubscribing from job ${jobId} updates`);
    eventSource.close();
  };
}

/**
 * Job persistence utilities for localStorage
 */
export const JobPersistence = {
  getStoredJobId: (sceneNumber: number): number | null => {
    const key = `video_job_scene_${sceneNumber}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  },

  storeJobId: (sceneNumber: number, jobId: number): void => {
    const key = `video_job_scene_${sceneNumber}`;
    localStorage.setItem(key, jobId.toString());
    console.log(`Stored job ID ${jobId} for scene ${sceneNumber}`);
  },

  clearJobId: (sceneNumber: number): void => {
    const key = `video_job_scene_${sceneNumber}`;
    localStorage.removeItem(key);
    console.log(`Cleared stored job ID for scene ${sceneNumber}`);
  },

  getStoredJobResult: (sceneNumber: number): VideoJobResponse | null => {
    const key = `video_result_scene_${sceneNumber}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored job result:', error);
        localStorage.removeItem(key);
      }
    }
    return null;
  },

  storeJobResult: (sceneNumber: number, result: VideoJobResponse): void => {
    const key = `video_result_scene_${sceneNumber}`;
    localStorage.setItem(key, JSON.stringify(result));
    console.log(`Stored job result for scene ${sceneNumber}:`, result.status);
  },

  clearJobResult: (sceneNumber: number): void => {
    const key = `video_result_scene_${sceneNumber}`;
    localStorage.removeItem(key);
    console.log(`Cleared stored job result for scene ${sceneNumber}`);
  },

  clearAllJobData: (sceneNumber: number): void => {
    JobPersistence.clearJobId(sceneNumber);
    JobPersistence.clearJobResult(sceneNumber);
  },
};

/**
 * React Hook for managing video job lifecycle
 */
export function useVideoJob(sceneNumber: number) {
  const [jobId, setJobId] = React.useState<number | null>(
    JobPersistence.getStoredJobId(sceneNumber)
  );
  
  const [jobResult, setJobResult] = React.useState<VideoJobResponse | null>(
    JobPersistence.getStoredJobResult(sceneNumber)
  );
  
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  // Subscribe to job updates when jobId changes
  React.useEffect(() => {
    if (!jobId || !jobResult || jobResult.status === 'completed' || jobResult.status === 'failed' || jobResult.status === 'expired') {
      return;
    }

    console.log(`Setting up SSE subscription for job ${jobId}`);
    setIsConnected(true);
    setError(null);

    const unsubscribe = subscribeToJobUpdates(
      jobId,
      (update) => {
        const updatedResult: VideoJobResponse = {
          ...jobResult,
          ...update,
          createdAt: jobResult.createdAt, // Preserve original creation date
        };
        
        setJobResult(updatedResult);
        JobPersistence.storeJobResult(sceneNumber, updatedResult);
        
        if (update.status === 'completed' || update.status === 'failed' || update.status === 'expired') {
          setIsConnected(false);
        }
      },
      (error) => {
        console.error(`Job ${jobId} subscription error:`, error);
        setError(error.message);
        setIsConnected(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsConnected(false);
    };
  }, [jobId, jobResult?.status, sceneNumber]);

  // Create new video job
  const createJob = async (request: VideoJobRequest) => {
    try {
      setError(null);
      console.log('Creating video job for scene', sceneNumber, request);
      
      const response = await createVideoJob(request);
      
      setJobId(response.id);
      setJobResult(response);
      
      JobPersistence.storeJobId(sceneNumber, response.id);
      JobPersistence.storeJobResult(sceneNumber, response);
      
      console.log(`Created job ${response.id} for scene ${sceneNumber}:`, response);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create video job:', error);
      setError(errorMessage);
      throw error;
    }
  };

  // Clear job data
  const clearJob = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setJobId(null);
    setJobResult(null);
    setError(null);
    setIsConnected(false);
    
    JobPersistence.clearAllJobData(sceneNumber);
  };

  return {
    jobId,
    jobResult,
    isConnected,
    error,
    createJob,
    clearJob,
  };
}

// Make React available for the hook
import React from 'react';