
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ocrReceiptClient } from '@/lib/ocr-tesseract';
import type { Expense } from '@/lib/definitions';

const expenseFormSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
  currency: z.string().min(3, { message: 'Currency is required.' }).max(3),
  category: z.string().min(1, { message: 'Please select a category.' }),
  date: z.date({ required_error: 'A date is required.' }),
  receipt: z.any().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const defaultValues: Partial<ExpenseFormValues> = {
  currency: 'USD',
  category: 'Other',
  date: new Date(),
};

const receiptPlaceholder = PlaceHolderImages.find(p => p.id === 'receipt-placeholder');

export function ExpenseForm({ onSubmit: customOnSubmit }: { onSubmit?: (data: Omit<Expense, 'id' | 'status' | 'employee'>) => void }) {
  const [receiptPreview, setReceiptPreview] = useState<string | null>(receiptPlaceholder?.imageUrl ?? null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const handleReceiptChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        setReceiptPreview(dataUri);
        
        setIsScanning(true);
        toast({
          title: "Scanning receipt...",
          description: "Please wait while we extract the details.",
        });

        try {
            const result = await ocrReceiptClient(dataUri);

            if (!result) {
              throw new Error("The AI model returned no data.");
            }

            toast({
                title: "Scan Complete!",
                description: "We've pre-filled the form for you.",
            });

        if (result.description) form.setValue('description', result.description);
        if (result.amount) form.setValue('amount', parseFloat(result.amount));
        if (result.date) form.setValue('date', new Date(result.date));
            if (result.expenseType) {
                 const validCategories = ["Meals & Entertainment", "Travel", "Software", "Office Supplies", "Other"];
                 if (validCategories.includes(result.expenseType)) {
                    form.setValue('category', result.expenseType);
                 }
            }
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Scan Failed",
                description: "Could not read receipt details.",
            });
            console.error(error);
        } finally {
            setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(data: ExpenseFormValues) {
    console.log(data);
    const submissionData = {
        ...data,
        date: data.date.toISOString(),
    };
    toast({
      title: "Expense Submitted!",
      description: "Your expense has been submitted for approval.",
    });
    if(customOnSubmit) {
        customOnSubmit(submissionData);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-4">
        <h3 className="font-semibold text-lg font-headline">Receipt</h3>
        <div className="relative aspect-[3/4] w-full rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
          {receiptPreview ? (
            <Image src={receiptPreview} alt="Receipt preview" fill={true} objectFit="contain" data-ai-hint="receipt document" />
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <Upload className="mx-auto h-10 w-10 mb-2" />
              <p>Upload a receipt</p>
            </div>
          )}
           {isScanning && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        <Input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleReceiptChange} disabled={isScanning} />
        <Button variant="outline" asChild className='w-full'>
            <label htmlFor="receipt-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" /> Upload & Scan
            </label>
        </Button>
      </div>
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Client dinner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Meals & Entertainment">Meals & Entertainment</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date of Expense</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isScanning}>
                {isScanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Scanning...</> : 'Submit Expense'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
