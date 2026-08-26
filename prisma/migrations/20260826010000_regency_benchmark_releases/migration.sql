CREATE TABLE "regency_benchmark_releases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "release_version" VARCHAR(100) NOT NULL,
    "cohort_size" INTEGER NOT NULL,
    "cell_counts" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regency_benchmark_releases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "regency_benchmark_releases_cohort_size_check" CHECK ("cohort_size" >= 0),
    CONSTRAINT "regency_benchmark_releases_cell_counts_array_check"
      CHECK (jsonb_typeof("cell_counts") = 'array')
);

CREATE UNIQUE INDEX "regency_benchmark_releases_release_version_key"
ON "regency_benchmark_releases"("release_version");
