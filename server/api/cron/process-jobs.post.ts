import { sendScheduledReviewRequest } from '../../lib/review-requests'

/**
 * POST /api/cron/process-jobs
 *
 * Processes all scheduled_jobs rows where run_at <= now and status = pending.
 * Call this endpoint every 15 minutes via Vercel Cron or an external scheduler.
 *
 * The endpoint is intentionally unauthenticated — protect it with a CRON_SECRET
 * header check in production if needed.
 */
export default defineEventHandler(async (_event) => {
  const db = useSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: jobs, error } = await db
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', now)
    .limit(50)

  if (error) throw createError({ statusCode: 500, message: error.message })
  if (!jobs?.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0

  for (const job of jobs) {
    // Atomically claim the job — only update if it's still pending to prevent double-processing
    const { error: claimError } = await db
      .from('scheduled_jobs')
      .update({ status: 'running' })
      .eq('id', job.id)
      .eq('status', 'pending')

    if (claimError) continue

    try {
      await processJob(job, db)
      await db.from('scheduled_jobs').update({ status: 'done' }).eq('id', job.id)
      processed++
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await db.from('scheduled_jobs').update({ status: 'failed', error: errMsg }).eq('id', job.id)
      console.error(`[cron] Job ${job.id} (${job.job_type}) failed:`, errMsg)
      failed++
    }
  }

  return { processed, failed }
})

async function processJob(job: any, db: any): Promise<void> {
  switch (job.job_type) {
    case 'review_request':
      await sendScheduledReviewRequest(job.tenant_id, job.payload, db)
      break
    case 'appointment_reminder':
      // Handled in Task 3
      break
    default:
      throw new Error(`Unknown job_type: ${job.job_type}`)
  }
}
