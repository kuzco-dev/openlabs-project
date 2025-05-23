// Exemple dans AdminOverview.tsx
export default function AdminOrders({
    institutionId,
    catalogId
  }: {
    institutionId: string
    catalogId: string
  }) {
    return (
      <div>
        <h2>orders for Catalog: {catalogId}</h2>
        <p>Institution ID: {institutionId}</p>
      </div>
    )
  }
  