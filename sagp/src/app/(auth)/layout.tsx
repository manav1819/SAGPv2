export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sagp-login-page sagp-app px-4">
      <div className="sagp-radial-center" />
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
