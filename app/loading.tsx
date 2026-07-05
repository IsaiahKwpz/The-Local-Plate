export default function Loading() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-olive"
        role="status"
        aria-label="Loading"
      />
    </main>
  );
}
