'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { OPENROUTER_MODELS } from '@/services/openrouter-service';
import { Info, Sparkles, Cpu, Brain, Bot, CornerRightDown } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  useCases: string[];
  publisher: string;
}

const MODEL_INFO: Record<string, ModelInfo> = {
  [OPENROUTER_MODELS.GPT_4]: {
    id: OPENROUTER_MODELS.GPT_4,
    name: 'GPT-4 Turbo',
    icon: <Cpu className="h-5 w-5" />,
    description: 'Modèle avancé d\'OpenAI pour l\'analyse médicale générale',
    useCases: ['Analyse complète de données médicales', 'Génération de rapports détaillés', 'Recommandations personnalisées'],
    publisher: 'OpenAI'
  },
  [OPENROUTER_MODELS.CLAUDE]: {
    id: OPENROUTER_MODELS.CLAUDE,
    name: 'Claude 3 Opus',
    icon: <Brain className="h-5 w-5" />,
    description: 'Modèle de pointe d\'Anthropic spécialisé dans l\'analyse médicale',
    useCases: ['Interprétation précise de données cliniques', 'Analyse scientifique approfondie', 'Rapports médicaux structurés'],
    publisher: 'Anthropic'
  },
  [OPENROUTER_MODELS.LLAMA_3]: {
    id: OPENROUTER_MODELS.LLAMA_3,
    name: 'Llama 3 (70B)',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Modèle open-source de Meta optimisé pour les analyses détaillées',
    useCases: ['Analyse des tendances', 'Détection de corrélations', 'Vulgarisation médicale'],
    publisher: 'Meta'
  },
  [OPENROUTER_MODELS.MEDICAL_SPECIALIZED]: {
    id: OPENROUTER_MODELS.MEDICAL_SPECIALIZED,
    name: 'Médical Spécialisé',
    icon: <Bot className="h-5 w-5" />,
    description: 'Modèle optimisé pour l\'analyse cardiologique',
    useCases: ['Interprétation de constantes cardiaques', 'Analyse des risques cardiovasculaires', 'Recommandations médicales précises'],
    publisher: 'T-Cardio AI'
  }
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelectedModel, setLocalSelectedModel] = useState(selectedModel);

  // Synchroniser le modèle local avec le modèle sélectionné externe
  useEffect(() => {
    setLocalSelectedModel(selectedModel);
  }, [selectedModel]);

  // Récupérer les infos du modèle sélectionné
  const selectedModelInfo = MODEL_INFO[localSelectedModel] || MODEL_INFO[OPENROUTER_MODELS.GPT_4];

  const handleConfirm = () => {
    onModelSelect(localSelectedModel);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-sm">
          {selectedModelInfo.icon}
          <span className="max-w-32 truncate">{selectedModelInfo.name}</span>
          <CornerRightDown className="h-3 w-3 opacity-70" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélectionner un modèle d'IA</DialogTitle>
          <DialogDescription>
            Choisissez le modèle d'intelligence artificielle pour l'analyse de vos données de santé
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <RadioGroup
            value={localSelectedModel}
            onValueChange={setLocalSelectedModel}
            className="space-y-3"
          >
            {Object.values(MODEL_INFO).map((model) => (
              <div key={model.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-50">
                <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor={model.id}
                    className="flex items-center text-sm font-medium cursor-pointer"
                  >
                    {model.icon}
                    <span className="ml-2">{model.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{model.publisher}</span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.useCases.map((useCase, i) => (
                      <span
                        key={`${model.id}-${i}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="bg-blue-50 p-3 rounded-md flex items-start">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Différents modèles peuvent donner des analyses avec des styles et niveaux de détails variés.
              Les modèles spécialisés peuvent offrir une meilleure compréhension des données médicales.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localSelectedModel === selectedModel}
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
