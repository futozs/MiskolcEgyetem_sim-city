'use client';

import { useLoadedData } from '@/lib/api/hooks';
import { Card, CardBody, CardHeader, Spinner } from '@nextui-org/react';
import { ResponsivePie } from '@nivo/pie';
import { useEffect } from 'react';

export function BuildingTypeChart() {
  const { data, isLoading, isDataLoaded } = useLoadedData();
  const { charts } = data;
  
  // Debug
  useEffect(() => {
    if (charts && charts.epuletTipusokChart) {
      console.log('Building chart data loaded:', charts.epuletTipusokChart.length, 'items');
    }
  }, [charts]);
  
  // Get pie chart data
  const pieData = charts?.epuletTipusokChart || [];
  
  // Pie chart colors
  const colors = {
    'lakóház': '#4e79a7',
    'középület': '#f28e2c',
    'vallási': '#e15759',
    'lakóépület': '#76b7b2',
    // Fallbacks for varying case
    'lakoház': '#4e79a7',
    'kozepulet': '#f28e2c',
    'vallási': '#e15759',
    'lakoepulet': '#76b7b2',
  };
  
  // Custom color function
  const getColor = (d: any) => colors[d.id as keyof typeof colors] || '#59a14f';
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
        <h4 className="font-bold text-large">Épületek Típus Szerint</h4>
        <p className="text-tiny text-default-500">
          Épületek megoszlása típus szerint
        </p>
      </CardHeader>
      <CardBody className="py-0 overflow-visible h-[300px]">
        {!isDataLoaded || !charts || pieData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <Spinner color="primary" />
          </div>
        ) : (
          <ResponsivePie
            data={pieData}
            margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
            innerRadius={0.4}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={getColor}
            borderWidth={1}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 0.2]],
            }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#777777"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{
              from: 'color',
              modifiers: [['darker', 2]],
            }}
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 56,
                translateY: 0,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 24,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
              },
            ]}
          />
        )}
      </CardBody>
    </Card>
  );
} 