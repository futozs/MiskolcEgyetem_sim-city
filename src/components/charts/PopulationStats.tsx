'use client';

import { useAppStore } from '@/store/appStore';
import { Card, CardBody, CardHeader, Progress } from '@nextui-org/react';
import { BarList, Bold, Flex, Text, Title } from '@tremor/react';

export function PopulationStats() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  
  // Get population data
  const population = charts?.altalanosMutatok.lakossagSzama || 0;
  const satisfaction = charts?.altalanosMutatok.elegedettseg || 0;
  
  // Get age distribution data
  const ageDistribution = charts?.korEloszlasChart || [];
  
  // Format age distribution data for BarList
  const ageData = ageDistribution.map((item) => ({
    name: item.korosztaly,
    value: item.ertek,
  }));
  
  // Calculate color based on satisfaction
  const getSatisfactionColor = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
        <h4 className="font-bold text-large">Lakosság</h4>
        <p className="text-tiny text-default-500">
          Demográfiai adatok
        </p>
      </CardHeader>
      <CardBody className="py-4 space-y-6">
        <div className="flex flex-col gap-1">
          <Flex>
            <Text>Összlakosság</Text>
            <Text>{population.toLocaleString('hu-HU')} fő</Text>
          </Flex>
          
          <Flex className="mt-4">
            <Text>Elégedettség</Text>
            <Text>{satisfaction}%</Text>
          </Flex>
          <Progress 
            value={satisfaction} 
            color={getSatisfactionColor(satisfaction) as any} 
            showValueLabel 
            className="mt-1"
          />
        </div>
        
        {ageDistribution.length > 0 ? (
          <div>
            <Title className="text-sm font-medium mb-2">Korosztályok szerinti megoszlás</Title>
            <BarList 
              data={ageData} 
              color="blue"
              showAnimation
            />
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4 text-sm">
            Nincs elérhető korosztály adat
          </div>
        )}
        
        <div className="flex flex-col mt-2 text-sm">
          <Flex>
            <Bold>Szolgáltatások száma:</Bold>
            <Text>{charts?.altalanosMutatok.szolgaltatasokSzama || 0}</Text>
          </Flex>
          <Flex>
            <Bold>Épületek száma:</Bold>
            <Text>{charts?.altalanosMutatok.epuletekSzama || 0}</Text>
          </Flex>
          <Flex>
            <Bold>Aktív projektek:</Bold>
            <Text>{charts?.altalanosMutatok.aktivProjektek || 0}</Text>
          </Flex>
        </div>
      </CardBody>
    </Card>
  );
} 