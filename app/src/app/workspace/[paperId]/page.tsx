import { WorkspaceClientPage } from "@/components/workspace/WorkspaceClientPage";

interface Props {
  params: Promise<{ paperId: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const { paperId } = await params;
  return <WorkspaceClientPage paperId={paperId} />;
}
