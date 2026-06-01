import { FolderView } from "@/components/folders/FolderView"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <FolderView courseId={id} />
}
