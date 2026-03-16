// =============================================================================
// PÁGINA: COMPARE - Real Estate React
// =============================================================================

import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCompare, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Property } from '@/types/property';
import { PROPERTY_TYPE_LABELS, OPERATION_TYPE_LABELS } from '@/types/property';
import { formatPrice, formatArea } from '@/lib/utils';

interface ComparePageProps {
  compareList: Property[];
  onToggleCompare: (property: Property) => void;
}

export function ComparePage({ compareList, onToggleCompare }: ComparePageProps): React.ReactElement {
  const navigate = useNavigate();

  // =========================================================================
  // HELPERS PARA RESALTAR MEJOR VALOR
  // =========================================================================
  const getMin = (values: number[]) => Math.min(...values);
  const getMax = (values: number[]) => Math.max(...values);

  const prices     = compareList.map((p) => p.price);
  const areas      = compareList.map((p) => p.area);
  const pricePSqm  = compareList.map((p) => (p.area > 0 ? Math.round(p.price / p.area) : 0));

  const minPrice    = getMin(prices);
  const maxArea     = getMax(areas);
  const minPriceSqm = getMin(pricePSqm);

  // =========================================================================
  // EMPTY STATE
  // =========================================================================
  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <GitCompare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No hay propiedades para comparar</h2>
        <p className="text-muted-foreground mb-6">
          Regresa al inicio y selecciona hasta 3 propiedades.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </div>
    );
  }

  // =========================================================================
  // FILAS DE MÉTRICAS
  // =========================================================================
  const rows: {
    label: string;
    render: (p: Property, index: number) => string;
    isBest?: (p: Property, index: number) => boolean;
  }[] = [
    {
      label: 'Precio',
      render: (p) => formatPrice(p.price),
      isBest: (p) => p.price === minPrice,
    },
    {
      label: 'Tipo',
      render: (p) => PROPERTY_TYPE_LABELS[p.propertyType],
    },
    {
      label: 'Operación',
      render: (p) => OPERATION_TYPE_LABELS[p.operationType],
    },
    {
      label: 'Habitaciones',
      render: (p) => `${p.bedrooms}`,
    },
    {
      label: 'Baños',
      render: (p) => `${p.bathrooms}`,
    },
    {
      label: 'Área',
      render: (p) => formatArea(p.area),
      isBest: (p) => p.area === maxArea,
    },
    {
      label: 'Precio / m²',
      render: (_p, index) => formatPrice(pricePSqm[index]),
      isBest: (_p, index) => pricePSqm[index] === minPriceSqm,
    },
    {
      label: 'Ciudad',
      render: (p) => p.city,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Comparar Propiedades</h1>
          <p className="text-muted-foreground">
            {compareList.length} {compareList.length === 1 ? 'propiedad' : 'propiedades'} seleccionadas
          </p>
        </div>
      </div>

      {/* Tabla de comparación */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Columna de etiquetas */}
              <th className="p-4 text-left bg-muted font-semibold w-32 border border-border">
                Métrica
              </th>

              {/* Una columna por propiedad */}
              {compareList.map((p) => {
                const imageUrl =
                  p.images?.[0] ??
                  `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(p.propertyType)}`;

                return (
                  <th key={p.id} className="p-4 bg-muted border border-border min-w-[200px]">
                    <Card className="text-left">
                      <CardContent className="p-3">
                        <img
                          src={imageUrl}
                          alt={p.title}
                          className="w-full h-24 object-cover rounded-md mb-2"
                        />
                        <p className="font-semibold text-sm line-clamp-2 mb-2">{p.title}</p>
                        {/* Botón quitar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={() => onToggleCompare(p)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Quitar
                        </Button>
                      </CardContent>
                    </Card>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-muted/50 transition-colors">
                {/* Etiqueta */}
                <td className="p-4 font-medium text-sm bg-muted/30 border border-border">
                  {row.label}
                </td>

                {/* Valor por propiedad */}
                {compareList.map((p, index) => {
                  const best = row.isBest ? row.isBest(p, index) : false;
                  return (
                    <td
                      key={p.id}
                      className={`p-4 text-center border border-border text-sm ${
                        best ? 'bg-green-50 font-bold text-green-700' : ''
                      }`}
                    >
                      {row.render(p, index)}
                      {best && (
                        <Star className="h-3 w-3 inline ml-1 text-green-600 fill-green-600" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
        <Star className="h-4 w-4 text-green-600 fill-green-600" />
        <span>Indica el mejor valor en esa categoría</span>
      </div>
    </div>
  );
}
