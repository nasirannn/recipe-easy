import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ImageModel } from "@/lib/services/image-service";
import { Badge } from "./badge";

interface ModelSelectorProps {
  selected: ImageModel;
  onChange: (model: ImageModel) => void;
  disabled?: boolean;
}

export function ModelSelector({ selected, onChange, disabled = false }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Image Generation Models</h3>
        {selected === 'flux' && (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
            High Quality
          </Badge>
        )}
      </div>
      
      <RadioGroup 
        value={selected} 
        onValueChange={value => !disabled && onChange(value as ImageModel)}
        className="grid grid-cols-2 gap-4"
        disabled={disabled}
      >
        <div className={`flex flex-col gap-2 border rounded-lg p-3 ${selected === 'wanx' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="wanx" id="wanx" disabled={disabled} />
            <Label htmlFor="wanx" className="font-medium cursor-pointer">Wanx Model</Label>
          </div>
          <div className="text-xs text-muted-foreground pl-6">
            <ul className="list-disc pl-4 space-y-1">
              <li>Free</li>
              <li>Better with Chinese prompts</li>
              <li>Faster generation (10-15s)</li>
            </ul>
          </div>
        </div>
        
        <div className={`flex flex-col gap-2 border rounded-lg p-3 ${selected === 'flux' ? 'border-primary bg-muted/50' : 'border-muted-foreground/20'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="flux" id="flux" disabled={disabled} />
            <Label htmlFor="flux" className="font-medium cursor-pointer">Flux Schnell</Label>
          </div>
          <div className="text-xs text-muted-foreground pl-6">
            <ul className="list-disc pl-4 space-y-1">
              <li>High quality</li>
              <li>Better realism and details</li>
              <li>Fast generation (8-15s)</li>
            </ul>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
} 