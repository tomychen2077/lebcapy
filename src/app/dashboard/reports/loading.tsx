import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReportsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="large" message="Loading reports..." />
    </div>
  );
}