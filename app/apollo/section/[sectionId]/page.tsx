// app/apollo/section/[sectionId]/page.tsx
import SectionFullView from "@/app/apollo/components/SectionFullView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page({ params }: { params: { sectionId: string } }) {
  const { sectionId } = params;
  return <SectionFullView sectionId={sectionId} />;
}
