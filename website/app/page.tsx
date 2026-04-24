export default function HomePage() {
  // `/` is normally 302-redirected to `/<locale>` by the CloudFront function
  // (see infra/cloudformation.yaml → UrlRewriteFunction). This page only
  // renders if the edge redirect doesn't fire — so it must not trigger any
  // client-side navigation (that destroyed the JS execution context the
  // WebMCP checker probes). noscript meta-refresh is the only safe fallback.
  return (
    <noscript>
      <meta httpEquiv="refresh" content="0;url=/en" />
    </noscript>
  );
}
