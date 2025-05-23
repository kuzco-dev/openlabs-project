// Exemple dans AdminOverview.tsx
export default function AdminItems({
    institutionId,
    catalogId
  }: {
    institutionId: string
    catalogId: string
  }) {
    return (
      <div>
        <h2>item for Catalog: {catalogId}</h2>
        <p>Institution ID: {institutionId}</p>
      </div>
    )
  }
  