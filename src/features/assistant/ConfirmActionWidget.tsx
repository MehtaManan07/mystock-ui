import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConfirmActionWidget as ConfirmActionWidgetModel } from '../../types/assistant';

interface Props {
  widget: ConfirmActionWidgetModel;
}

/**
 * Renders a staged-action confirmation. The buttons are intentionally disabled:
 * the decision endpoint does not exist server-side yet (it ships with the real
 * agent). The card is built now so the UI is ready the day it does.
 */
export default function ConfirmActionWidget({ widget }: Props) {
  return (
    <div className="mb-3 flex justify-start">
      <Card className="w-full max-w-[82%]">
        <CardContent>
          <h4 className="mb-2 text-sm font-medium">{widget.title}</h4>
          <Separator className="mb-3" />

          <div className="flex flex-col gap-1.5">
            {widget.fields.map((field, i) => (
              <div key={i} className="flex gap-3">
                <p className="w-30 shrink-0 text-sm text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm break-words">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-row gap-2">
            <Tooltip>
              {/* Span wrapper keeps the tooltip reachable while the button is disabled. */}
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant={widget.destructive ? 'destructive' : 'default'}
                    disabled
                  >
                    {widget.confirm_label}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Confirming actions isn't available yet — coming soon
              </TooltipContent>
            </Tooltip>
            <Button size="sm" variant="ghost" disabled>
              {widget.cancel_label}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
