```tsx
export function Dashboard() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-3xl font-bold">
          Dashboard
        </h2>

        <p className="text-muted-foreground">
          Visão geral e indicadores em tempo real
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">
            📦 Estoque Inteligente
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            Reposição automática e previsão de consumo
          </p>
        </div>

      </div>

    </div>
  );
}
```
