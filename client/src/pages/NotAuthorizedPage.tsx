import { Layout } from "../components/Layout";

export function NotAuthorizedPage() {
  return (
    <Layout>
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Not authorized</h1>
        <p className="mt-2 text-gray-500">
          Your account does not have access to this application yet. Please contact an administrator.
        </p>
      </div>
    </Layout>
  );
}
