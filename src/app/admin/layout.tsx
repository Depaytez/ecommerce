/**
 * Admin Root Layout
 * 
 * Provides full-bleed layout container for admin routes.
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-radiance-creamBackgroundColor">
      {children}
    </div>
  );
}
