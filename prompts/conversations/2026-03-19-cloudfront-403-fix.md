# CloudFront 403 Fix

**Date:** 2026-03-19

## Summary

The site at recipes.atlow.co.il returned 403 for all paths including `/index.html`, indicating a bucket policy/OAC issue rather than a URL rewriting problem.

## Root Cause

Two issues in the CloudFormation template:
1. `S3OriginConfig` with explicit `OriginAccessIdentity: ""` could conflict with OAC — changed to empty object `{}`
2. Missing `s3:ListBucket` permission in the bucket policy — S3 returns 403 (not 404) for missing keys when only `s3:GetObject` is granted

## Changes

- Reverted commit `0de2de2` (CloudFront Function + trailingSlash) — those changes addressed URL routing, not the permissions issue
- Fixed `S3OriginConfig` to use `{}` instead of `OriginAccessIdentity: ""`
- Added `s3:ListBucket` statement to the bucket policy scoped to the CloudFront distribution ARN

## Files Modified
- `infra/cloudformation.yaml` — bucket policy + origin config fix
- `website/next.config.ts` — reverted trailingSlash
