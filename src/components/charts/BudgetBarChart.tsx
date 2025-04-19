'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart } from '@tremor/react';
import { 
  IconCoin, 
  IconCash, 
  IconReceipt, 
  IconChevronUp, 
  IconChevronDown, 
  IconInfoCircle
} from '@tabler/icons-react';

export function BudgetBarChart() {
  const { getTransformedData } = useAppStore();
  const { charts, esemenyek } = getTransformedData();
  
  // Get budget data from the store
  const revenues = charts?.penzugyiData?.bevetelKiadasok || {};
  const currentBudget = charts?.penzugyiData?.keret || 0;
  
  // State for active category
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  
  // Format currency - defined early to avoid initialization errors
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Extract financial data from events
  const financialEvents = useMemo(() => {
    if (!esemenyek || esemenyek.length === 0) return [];
    
    const events = [];
    
    // Process each event
    esemenyek.forEach(event => {
      const { esemeny, fordulo, hatas } = event;
      let amount = hatas?.penz || 0;
      let category = '';
      let description = '';
      
      // Extract additional financial info from event title if it exists
      if (esemeny.nev.includes('Ft')) {
        // Try to extract amount and category from title
        try {
          const parts = esemeny.nev.split(':');
          if (parts.length >= 2) {
            category = parts[0].trim();
            description = esemeny.leiras || esemeny.nev;
            
            // Try to extract a numeric amount if hatas.penz is 0
            if (amount === 0) {
              const amountMatch = esemeny.nev.match(/[\d,.]+/g);
              if (amountMatch) {
                const cleanAmount = amountMatch[0].replace(/[^\d.-]/g, '');
                const parsedAmount = parseFloat(cleanAmount.replace(/,/g, ''));
                if (!isNaN(parsedAmount)) {
                  // If we have "bevétel" in the title, it's income
                  // If we have "költség" or "kiadás", it's expense
                  if (category.toLowerCase().includes('bevétel')) {
                    amount = parsedAmount;
                  } else if (
                    category.toLowerCase().includes('költség') || 
                    category.toLowerCase().includes('kiadás') ||
                    category.toLowerCase().includes('karbantartás')
                  ) {
                    amount = -parsedAmount;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing financial event:', e);
        }
        
        if (category && amount !== 0) {
          events.push({
            fordulo,
            category,
            amount,
            description,
            type: amount > 0 ? 'Bevétel' : 'Kiadás'
          });
        }
      }
    });
    
    // Sort by amount (descending)
    return events.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [esemenyek]);
  
  // Group financial events by type
  const groupedFinancialEvents = useMemo(() => {
    const revenues = financialEvents.filter(e => e.amount > 0);
    const expenses = financialEvents.filter(e => e.amount < 0);
    
    return { revenues, expenses };
  }, [financialEvents]);
  
  // Transform the data for the bar chart
  const chartData = useMemo(() => {
    const result = [];
    
    // Process each revenue/expense entry
    for (const [category, amount] of Object.entries(revenues)) {
      // Skip entries with 0 or undefined values
      if (!amount) continue;
      
      // Determine if this is revenue or expense
      const type = amount > 0 ? 'Bevétel' : 'Kiadás';
      
      // Add to the result array with absolute values
      result.push({
        category,
        [type]: Math.abs(amount),
      });
    }
    
    return result;
  }, [revenues]);
  
  // Calculate total revenues and expenses
  const { totalRevenue, totalExpense, balance } = useMemo(() => {
    let rev = 0;
    let exp = 0;
    
    for (const [_, amount] of Object.entries(revenues)) {
      if (amount > 0) {
        rev += amount;
      } else {
        exp += Math.abs(amount);
      }
    }
    
    return { 
      totalRevenue: rev, 
      totalExpense: exp, 
      balance: rev - exp 
    };
  }, [revenues]);
  
  // Budget balance (positive or negative)
  const isPositive = balance >= 0;
  
  return (
    <div className="h-full w-full">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1 }}
          className="absolute -left-20 -bottom-10 w-60 h-60 rounded-full bg-green-500 filter blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-red-500 filter blur-3xl"
        />
      </div>
      
      {/* Budget summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
        {/* Current budget */}
        <motion.div 
          className="col-span-3 md:col-span-1 bg-gradient-to-br from-purple-500/10 to-blue-500/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-900/20">
                <IconCoin className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-foreground-500">Aktuális keret</p>
            </div>
            <div className="mt-auto">
              <motion.p 
                className="text-xl font-bold text-purple-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {formatCurrency(currentBudget)}
              </motion.p>
            </div>
          </div>
        </motion.div>
        
        {/* Revenue */}
        <motion.div 
          className="col-span-3 sm:col-span-1 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-900/20">
                <IconCash className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-sm text-foreground-500">Bevételek</p>
            </div>
            <div className="mt-auto">
              <motion.p 
                className="text-xl font-bold text-green-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {formatCurrency(totalRevenue)}
              </motion.p>
              <p className="text-xs text-foreground-500 mt-1">
                {groupedFinancialEvents.revenues.length} tétel
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Expenses */}
        <motion.div 
          className="col-span-3 sm:col-span-1 bg-gradient-to-br from-red-500/10 to-orange-500/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-900/20">
                <IconReceipt className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-sm text-foreground-500">Kiadások</p>
            </div>
            <div className="mt-auto">
              <motion.p 
                className="text-xl font-bold text-red-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {formatCurrency(totalExpense)}
              </motion.p>
              <p className="text-xs text-foreground-500 mt-1">
                {groupedFinancialEvents.expenses.length} tétel
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Budget balance indicator */}
      <motion.div 
        className="mb-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-foreground-500">Egyenleg</div>
          <div className={`font-medium text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? 'Pozitív' : 'Negatív'}: {formatCurrency(Math.abs(balance))}
          </div>
        </div>
        <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(Math.abs(balance) / (totalRevenue || 1) * 100, 100)}%` }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>
      
      {/* Bar chart */}
      <motion.div 
        className="relative z-10 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <BarChart
          className="h-[190px]"
          data={chartData}
          index="category"
          categories={["Bevétel", "Kiadás"]}
          colors={["emerald", "rose"]}
          showAnimation={true}
          animationDuration={1500}
          yAxisWidth={60}
          showLegend={false}
          layout="vertical"
          showGridLines={false}
          valueFormatter={(number) => formatCurrency(number)}
          onValueChange={(value) => setActiveCategory(value.category as string)}
          showTooltip={true}
          theme={{
            background: "transparent",
            chart: {
              backgroundColor: "transparent"
            },
            colors: {
              emerald: "#10b981",
              rose: "#f43f5e"
            },
            series: {
              bar: {
                borderRadius: 6
              }
            },
            axis: {
              stroke: {
                color: "rgba(255, 255, 255, 0.2)"
              },
              tick: {
                color: "rgba(255, 255, 255, 0.6)"
              },
              label: {
                color: "rgba(255, 255, 255, 0.9)"
              }
            },
            grid: {
              stroke: {
                color: "rgba(255, 255, 255, 0.1)"
              }
            },
            tooltip: {
              backgroundColor: "rgba(30, 41, 59, 0.9)",
              textColor: "white",
              borderColor: "rgba(99, 102, 241, 0.5)",
              fontSize: "0.875rem"
            }
          }}
        />
      </motion.div>
      
      {/* Information text */}
      <motion.div 
        className="text-xs text-foreground-400 text-center mt-4 bg-foreground/5 rounded-lg p-2.5 border border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <span className="text-foreground-500">Kattints</span> egy kategóriára a részletek megtekintéséhez
      </motion.div>
      
      {/* Detailed Financial Breakdown */}
      <motion.div 
        className="mt-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-foreground-700 flex items-center gap-2">
            <IconInfoCircle size={16} className="text-primary" />
            Részletes pénzügyi adatok
          </h3>
          <button 
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="text-xs text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full"
          >
            {showDetailedBreakdown ? 
              <><IconChevronUp size={14} /> Bezárás</> : 
              <><IconChevronDown size={14} /> Részletek mutatása</>
            }
          </button>
        </div>
        
        {showDetailedBreakdown && (
          <div className="grid grid-cols-1 gap-2 mt-2 max-h-80 overflow-y-auto pr-1">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-content1/50 rounded-lg p-2 text-xs border border-foreground/5">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-600">Összes bevételi tétel:</span>
                  <span className="font-medium">{groupedFinancialEvents.revenues.length} db</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-foreground-600">Összérték:</span>
                  <span className="font-medium text-green-500">
                    {formatCurrency(groupedFinancialEvents.revenues.reduce((sum, item) => sum + item.amount, 0))}
                  </span>
                </div>
              </div>
              
              <div className="bg-content1/50 rounded-lg p-2 text-xs border border-foreground/5">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-600">Összes kiadási tétel:</span>
                  <span className="font-medium">{groupedFinancialEvents.expenses.length} db</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-foreground-600">Összérték:</span>
                  <span className="font-medium text-red-500">
                    {formatCurrency(Math.abs(groupedFinancialEvents.expenses.reduce((sum, item) => sum + item.amount, 0)))}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Revenue items */}
            {groupedFinancialEvents.revenues.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-1 rounded-md bg-green-500/20">
                    <IconCash size={14} className="text-green-500" />
                  </div>
                  <h4 className="text-xs font-medium">Bevételek</h4>
                </div>
                
                <div className="pl-6 space-y-2">
                  {groupedFinancialEvents.revenues.map((item, idx) => (
                    <motion.div 
                      key={`revenue-${idx}`}
                      className="bg-green-500/5 border border-green-500/10 rounded-lg p-2 text-xs"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-green-500 font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                      <p className="text-foreground-500 mt-1 text-[10px] truncate">
                        {item.description}
                      </p>
                      <div className="flex justify-between mt-1 text-[10px] text-foreground-500">
                        <span>#{item.fordulo}. forduló</span>
                        <span>{(item.amount / 1000000).toFixed(1)} millió Ft</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            
            {/* Expense items */}
            {groupedFinancialEvents.expenses.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <div className="p-1 rounded-md bg-red-500/20">
                    <IconReceipt size={14} className="text-red-500" />
                  </div>
                  <h4 className="text-xs font-medium">Kiadások</h4>
                </div>
                
                <div className="pl-6 space-y-2">
                  {groupedFinancialEvents.expenses.map((item, idx) => (
                    <motion.div 
                      key={`expense-${idx}`}
                      className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-xs"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-red-500 font-bold">{formatCurrency(Math.abs(item.amount))}</span>
                      </div>
                      <p className="text-foreground-500 mt-1 text-[10px] truncate">
                        {item.description}
                      </p>
                      <div className="flex justify-between mt-1 text-[10px] text-foreground-500">
                        <span>#{item.fordulo}. forduló</span>
                        <span>{(Math.abs(item.amount) / 1000000).toFixed(1)} millió Ft</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            
            {/* No data case */}
            {financialEvents.length === 0 && (
              <div className="text-center py-8 text-xs text-foreground-500">
                <IconInfoCircle size={24} className="mx-auto mb-2 text-foreground-400 opacity-50" />
                <p className="font-medium">Nincs részletes pénzügyi adat</p>
                <p className="mt-1 text-[10px]">Az események megjelenésekor automatikusan frissül</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
} 