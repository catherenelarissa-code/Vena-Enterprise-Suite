```tsx
import React from "react";

export const Dashboard = () => {
  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="text-muted-foreground mt-2">
        Visão geral e indicadores em tempo real
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-xl border p-5">
          <h3 className="font-semibold">
            📦 Estoque Inteligente
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Reposição automática e previsão de consumo
          </p>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
```
