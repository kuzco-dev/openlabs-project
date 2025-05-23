// Exemple dans AdminOverview.tsx
export default function AdminUsers({
    institutionId,
    catalogId
  }: {
    institutionId: string
    catalogId: string
  }) {
    return (
      <div>
        <h2>users for Catalog: {catalogId}</h2>
        <p>Institution ID: {institutionId}</p>
      </div>
    )
  }
  