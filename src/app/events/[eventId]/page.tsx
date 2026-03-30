import { EventMemoDetailPage } from "@/components/home/event-memo-detail-page";

interface EventMemoDetailRoutePageProps {
  params: { eventId: string };
}

export default function EventMemoDetailRoutePage({ params }: EventMemoDetailRoutePageProps) {
  return <EventMemoDetailPage eventMemoId={params.eventId} />;
}
