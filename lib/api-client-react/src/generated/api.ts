import { useState } from "react";
import { useListMaterials, getListMaterialsQueryKey, useCreateMaterial, useUpdateMaterial } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Filter, AlertCircle, Package, Pencil, ArrowUpDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["Aterramento", "Cabos", "Caixas", "Condutores", "Conectores", "Disjuntores", "Eletrodutos", "EPI", "Estruturas", "Ferramentas", "Fixação", "Fotovoltaico", "Isoladores", "Outros", "Proteção", "Transformadores"];
const UNITS = ["un", "m", "mt", "kg", "cx", "rl", "par", "um"];

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  lastPurchasePrice?: number | null;
};

export function Materiais() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openMove, setOpenMove] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);
