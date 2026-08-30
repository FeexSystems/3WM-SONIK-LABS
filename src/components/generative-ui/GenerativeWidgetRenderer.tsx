import React from 'react';
import { EmarSpectrumWidget, EQBand } from './widgets/EmarSpectrumWidget';
import { RickyBounceWidget } from './widgets/RickyBounceWidget';
import { KingpinVocalWidget, VocalVoice } from './widgets/KingpinVocalWidget';
import { BigQueryForecastWidget } from './widgets/BigQueryForecastWidget';

export type GenerativeWidgetType =
  'emar_spectrum' | 'ricky_bounce' | 'kingpin_vocal' | 'bigquery_forecast';

export interface GenerativeWidgetPayload {
  type: GenerativeWidgetType;
  props?: Record<string, any>;
}

interface GenerativeWidgetRendererProps {
  widget: GenerativeWidgetPayload;
  onApplyAction?: (actionType: string, data: any) => void;
}

export const GenerativeWidgetRenderer: React.FC<GenerativeWidgetRendererProps> = ({
  widget,
  onApplyAction,
}) => {
  switch (widget.type) {
    case 'emar_spectrum':
      return (
        <EmarSpectrumWidget
          {...widget.props}
          onApplyToDaw={(bands: EQBand[]) => {
            if (onApplyAction) onApplyAction('APPLY_EQ_BANDS', { bands });
          }}
        />
      );

    case 'ricky_bounce':
      return (
        <RickyBounceWidget
          {...widget.props}
          onApplyToDaw={(pattern) => {
            if (onApplyAction) onApplyAction('APPLY_DRUM_GROOVE', pattern);
          }}
        />
      );

    case 'kingpin_vocal':
      return (
        <KingpinVocalWidget
          {...widget.props}
          onApplyToDaw={(config) => {
            if (onApplyAction) onApplyAction('APPLY_VOCAL_HARMONY', config);
          }}
        />
      );

    case 'bigquery_forecast':
      return <BigQueryForecastWidget {...widget.props} />;

    default:
      return null;
  }
};
