
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScoringLevel = {
  level: number;
  description: string;
};

type Criterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoring_levels?: Record<number, string>;
};

type CriteriaFormProps = {
  criteria: Criterion[];
  setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
  defaultCriteria: Criterion[];
  useCustomCriteria: boolean;
  setUseCustomCriteria: React.Dispatch<React.SetStateAction<boolean>>;
};

const CriteriaForm = ({
  criteria,
  setCriteria,
  defaultCriteria,
  useCustomCriteria,
  setUseCustomCriteria,
}: CriteriaFormProps) => {
  const { toast } = useToast();
  const [detailLevel, setDetailLevel] = useState<'basic' | 'advanced'>('basic');

  const addCriterion = () => {
    const newId = (criteria.length + 1).toString();
    const defaultScoringLevels = {
      1: 'Poor - Does not meet the criterion requirements',
      2: 'Fair - Partially meets some requirements with significant gaps',
      3: 'Good - Meets most requirements with minor gaps',
      4: 'Very Good - Fully meets all requirements',
      5: 'Excellent - Exceeds requirements in meaningful ways'
    };

    setCriteria([
      ...criteria,
      { 
        id: newId, 
        name: '', 
        description: '', 
        weight: 20,
        scoring_levels: defaultScoringLevels
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one criterion.",
        variant: "destructive",
      });
      return;
    }
    setCriteria(criteria.filter((c) => c.id !== id));
    normalizeWeights(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (
    id: string,
    field: keyof Criterion,
    value: string | number | Record<number, string>
  ) => {
    setCriteria(
      criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    
    if (field === 'weight') {
      normalizeWeights(
        criteria.map((c) => (c.id === id ? { ...c, weight: value as number } : c))
      );
    }
  };

  const updateScoringLevel = (
    criterionId: string,
    level: number,
    description: string
  ) => {
    setCriteria(
      criteria.map((c) => {
        if (c.id === criterionId) {
          const updatedScoringLevels = { 
            ...(c.scoring_levels || {}), 
            [level]: description 
          };
          return { ...c, scoring_levels: updatedScoringLevels };
        }
        return c;
      })
    );
  };

  const normalizeWeights = (updatedCriteria: Criterion[]) => {
    const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
    
    if (totalWeight > 0 && totalWeight !== 100) {
      const normalizedCriteria = updatedCriteria.map(c => ({
        ...c,
        weight: Math.round((c.weight / totalWeight) * 100)
      }));
      
      const calculatedTotal = normalizedCriteria.reduce((sum, c) => sum + c.weight, 0);
      if (calculatedTotal !== 100 && normalizedCriteria.length > 0) {
        const diff = 100 - calculatedTotal;
        const lastItem = normalizedCriteria[normalizedCriteria.length - 1];
        normalizedCriteria[normalizedCriteria.length - 1] = {
          ...lastItem,
          weight: lastItem.weight + diff
        };
      }
      
      setCriteria(normalizedCriteria);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <Label htmlFor="detail-level">Detail Level:</Label>
        <Tabs value={detailLevel} onValueChange={(value: 'basic' | 'advanced') => setDetailLevel(value)} className="ml-2">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {useCustomCriteria ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">Custom Criteria</h3>
            <Button onClick={addCriterion} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Criterion
            </Button>
          </div>

          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="p-4 border rounded-md bg-gray-50"
            >
              <div className="flex justify-between mb-3">
                <div className="flex-1 mr-4">
                  <Label htmlFor={`criterion-name-${criterion.id}`}>
                    Criterion Name
                  </Label>
                  <Input
                    id={`criterion-name-${criterion.id}`}
                    value={criterion.name}
                    onChange={(e) =>
                      updateCriterion(criterion.id, 'name', e.target.value)
                    }
                    placeholder="e.g., Clarity, Relevance, etc."
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCriterion(criterion.id)}
                  className="h-8 w-8 mt-6"
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </div>

              <div className="mb-3">
                <Label htmlFor={`criterion-desc-${criterion.id}`}>
                  Description
                </Label>
                <Textarea
                  id={`criterion-desc-${criterion.id}`}
                  value={criterion.description}
                  onChange={(e) =>
                    updateCriterion(
                      criterion.id,
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Describe what this criterion measures..."
                  className="mt-1"
                />
              </div>

              <div className="mb-1">
                <div className="flex justify-between">
                  <Label htmlFor={`criterion-weight-${criterion.id}`}>
                    Weight
                  </Label>
                  <span className="text-sm text-gray-500">
                    {criterion.weight}%
                  </span>
                </div>
                <Slider
                  id={`criterion-weight-${criterion.id}`}
                  value={[criterion.weight]}
                  min={5}
                  max={100}
                  step={5}
                  onValueChange={(value) =>
                    updateCriterion(criterion.id, 'weight', value[0])
                  }
                  className="mt-2"
                />
              </div>

              {detailLevel === 'advanced' && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="mb-2 block">Scoring Levels</Label>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm w-6">{level}:</span>
                        <Input
                          value={criterion.scoring_levels?.[level] || ''}
                          onChange={(e) => updateScoringLevel(criterion.id, level, e.target.value)}
                          placeholder={`Description for level ${level}`}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-md font-medium">Default Criteria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="p-4 border rounded-md bg-gray-50"
              >
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium">{criterion.name}</h4>
                  <span className="text-sm text-gray-500">
                    {criterion.weight}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {criterion.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaForm;
