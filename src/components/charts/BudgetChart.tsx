'use client';

import { useAppStore } from '@/store/appStore';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { 
  Card as TremorCard, 
  Metric, 
  Text, 
  Flex, 
  BadgeDelta, 
  DeltaType, 
  ProgressBar 
} from '@tremor/react';
import { memo, useMemo } from 'react';

export const BudgetChart = memo(function BudgetChart() {
  const getTransformedData = useAppStore((state) => state.getTransformedData);
  
  // Memoize the transformed data result to prevent unnecessary recalculations
  const charts = useMemo(() => {
    const result = getTransformedData();
    return result.charts;
  }, [getTransformedData]);
  
  // Get budget data
  const budget = charts?.penzugyiData?.keret || 0;
  
  // Extract revenue/expenses
  const revenues = charts?.penzugyiData?.bevetelKiadasok || {};
  
  // Memoize calculations to prevent recalculations on every render
  const {
    totalRevenue,
    totalExpenses,
    budgetPercentage,
    deltaType,
    deltaPercentage
  } = useMemo(() => {
    // Calculate total revenue and expenses
    const totalRev = Object.entries(revenues)
      .filter(([_, value]) => value > 0)
      .reduce((sum, [_, value]) => sum + value, 0);
    
    const totalExp = Object.entries(revenues)
      .filter(([_, value]) => value < 0)
      .reduce((sum, [_, value]) => sum + Math.abs(value), 0);
    
    // Calculate budget utilization percentage
    const budgetPct = 100 - (budget / (totalRev + budget) * 100);
    
    // Calculate delta for budget compared to start
    const dType: DeltaType = totalRev > totalExp ? "increase" : "decrease";
    const dPercentage = totalExp > 0 
      ? Math.round((totalRev - totalExp) / totalExp * 100) 
      : 100;
    
    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      budgetPercentage: budgetPct,
      deltaType: dType,
      deltaPercentage: dPercentage
    };
  }, [revenues, budget]);
  
  // Memoize the BadgeDelta content to prevent unnecessary re-renders
  const badgeDeltaContent = useMemo(() => {
    return (
      <BadgeDelta deltaType={deltaType} size="sm">
        {deltaPercentage}%
      </BadgeDelta>
    );
  }, [deltaType, deltaPercentage]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
        <h4 className="font-bold text-large">Költségvetés</h4>
        <p className="text-tiny text-default-500">
          Pénzügyi állapot
        </p>
      </CardHeader>
      <CardBody className="py-4 space-y-6">
        <TremorCard decoration="top" decorationColor="indigo">
          <Flex justifyContent="between" alignItems="center">
            <Text>Jelenlegi keret</Text>
            {badgeDeltaContent}
          </Flex>
          <Metric className="mt-2">
            {budget.toLocaleString('hu-HU')} Ft
          </Metric>
          <ProgressBar value={budgetPercentage} className="mt-3" color="indigo" />
          <Flex className="mt-3 text-gray-500 text-sm">
            <div>Felhasznált forrás</div>
            <div>{Math.round(budgetPercentage)}%</div>
          </Flex>
        </TremorCard>
        
        <div className="grid grid-cols-2 gap-4">
          <TremorCard decoration="top" decorationColor="emerald">
            <Text>Bevételek</Text>
            <Metric className="mt-2">
              {totalRevenue.toLocaleString('hu-HU')} Ft
            </Metric>
          </TremorCard>
          
          <TremorCard decoration="top" decorationColor="rose">
            <Text>Kiadások</Text>
            <Metric className="mt-2">
              {totalExpenses.toLocaleString('hu-HU')} Ft
            </Metric>
          </TremorCard>
        </div>
        
        <div className="text-sm text-gray-500 mt-2">
          <div className="font-semibold mb-1">Részletes bevétel-kiadások:</div>
          <ul className="space-y-1">
            {Object.entries(revenues).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span>{key}</span>
                <span className={value > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {value.toLocaleString('hu-HU')} Ft
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}); 