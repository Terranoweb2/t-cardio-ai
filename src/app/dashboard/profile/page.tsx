"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { PatientInfo } from "@/lib/types";
import { User, Bell, Clock, Settings, Trash2, Plus, Save, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  medications?: string[];
  medicalConditions?: string[];
}

interface ReminderSetting {
  id: string;
  enabled: boolean;
  time: string;
  days: string[];
  message: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
  });
  const [activeTab, setActiveTab] = useState("profile");
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Charger le profil utilisateur depuis le localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setProfile({
        id: userData.id || "",
        name: userData.displayName || "",
        email: userData.email || "",
        age: userData.age,
        gender: userData.gender,
        weight: userData.weight,
        height: userData.height,
        medications: userData.medications || [],
        medicalConditions: userData.medicalConditions || [],
      });
    }

    // Charger les préférences de rappel
    const storedReminders = localStorage.getItem("reminders");
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders));
    } else {
      // Créer un rappel par défaut
      setReminders([{
        id: Date.now().toString(),
        enabled: false,
        time: "08:00",
        days: ["Lun", "Mer", "Ven"],
        message: "N'oubliez pas de prendre votre tension artérielle!"
      }]);
    }

    // Vérifier si les notifications sont activées
    const notifEnabled = localStorage.getItem("notificationsEnabled");
    setNotificationsEnabled(notifEnabled === "true");
  }, []);

  const saveProfile = () => {
    // Convertir le profil au format attendu par l'application
    const userData: PatientInfo = {
      id: profile.id,
      displayName: profile.name,
      email: profile.email,
      age: profile.age,
      gender: profile.gender as 'male' | 'female' | 'other',
      weight: profile.weight,
      height: profile.height,
      medications: profile.medications,
      medicalConditions: profile.medicalConditions,
    };

    // Sauvegarder dans le localStorage
    localStorage.setItem("user", JSON.stringify(userData));

    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès.",
    });
  };

  const addReminder = () => {
    const newReminder: ReminderSetting = {
      id: Date.now().toString(),
      enabled: true,
      time: "09:00",
      days: ["Lun", "Mar", "Mer", "Jeu", "Ven"],
      message: "Prenez votre tension artérielle",
    };
    setReminders([...reminders, newReminder]);
    saveReminders([...reminders, newReminder]);
  };

  const removeReminder = (id: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const updateReminder = (id: string, field: keyof ReminderSetting, value: any) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, [field]: value } : reminder
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const saveReminders = (remindersToSave: ReminderSetting[]) => {
    localStorage.setItem("reminders", JSON.stringify(remindersToSave));

    toast({
      title: "Rappels mis à jour",
      description: "Vos paramètres de rappel ont été enregistrés avec succès.",
    });
  };

  const toggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem("notificationsEnabled", enabled.toString());

    if (enabled) {
      // Demander la permission pour les notifications du navigateur
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            toast({
              title: "Notifications activées",
              description: "Vous recevrez désormais des rappels pour prendre votre tension.",
            });
          } else {
            toast({
              title: "Permission refusée",
              description: "Les notifications ne peuvent pas être activées sans votre permission.",
              variant: "destructive",
            });
            setNotificationsEnabled(false);
            localStorage.setItem("notificationsEnabled", "false");
          }
        });
      }
    } else {
      toast({
        title: "Notifications désactivées",
        description: "Vous ne recevrez plus de rappels pour prendre votre tension.",
      });
    }
  };

  const toggleReminderDay = (reminderId: string, day: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    let updatedDays: string[];
    if (reminder.days.includes(day)) {
      updatedDays = reminder.days.filter(d => d !== day);
    } else {
      updatedDays = [...reminder.days, day];
    }

    updateReminder(reminderId, 'days', updatedDays);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres du profil</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Rappels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles et médicales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ""}
                    onChange={(e) => setProfile({ ...profile, age: Number.parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Genre</Label>
                  <Select
                    value={profile.gender || ""}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight || ""}
                    onChange={(e) => setProfile({ ...profile, weight: Number.parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Taille (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height || ""}
                    onChange={(e) => setProfile({ ...profile, height: Number.parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>

              {/* Section médicale */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-lg font-medium">Informations médicales</h3>
                <p className="text-sm text-gray-500">
                  Ces informations sont utilisées pour personnaliser les analyses et les recommandations
                </p>

                <div className="space-y-2">
                  <Label htmlFor="medications">Médicaments (séparés par des virgules)</Label>
                  <Input
                    id="medications"
                    value={profile.medications?.join(", ") || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        medications: e.target.value.split(",").map((med) => med.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Ex: Amlodipine 5mg, Lisinopril 10mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditions">Conditions médicales (séparées par des virgules)</Label>
                  <Input
                    id="conditions"
                    value={profile.medicalConditions?.join(", ") || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        medicalConditions: e.target.value.split(",").map((cond) => cond.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Ex: Hypertension, Diabète type 2"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer le profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des rappels</CardTitle>
              <CardDescription>
                Configurez des rappels pour ne pas oublier de prendre vos mesures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Activer les notifications</h4>
                  <p className="text-xs text-gray-500">
                    Recevez des rappels pour prendre régulièrement votre tension artérielle
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                />
              </div>

              {notificationsEnabled && (
                <>
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Mes rappels programmés</h4>
                      <Button onClick={addReminder} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un rappel
                      </Button>
                    </div>

                    {reminders.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p>Aucun rappel configuré</p>
                        <p className="text-xs mt-1">
                          Ajoutez un rappel pour être notifié quand prendre votre tension
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className="border rounded-md p-3 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Switch
                                  checked={reminder.enabled}
                                  onCheckedChange={(checked) => updateReminder(reminder.id, 'enabled', checked)}
                                  className="mr-2"
                                />
                                <div>
                                  <p className="text-sm font-medium">Rappel {reminder.enabled ? 'actif' : 'inactif'}</p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {reminder.time}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeReminder(reminder.id)}
                                className="h-8 w-8 p-0 text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <Label htmlFor={`time-${reminder.id}`} className="text-xs">Heure</Label>
                                <Input
                                  id={`time-${reminder.id}`}
                                  type="time"
                                  value={reminder.time}
                                  onChange={(e) => updateReminder(reminder.id, 'time', e.target.value)}
                                  className="h-8"
                                />
                              </div>

                              <div>
                                <Label className="text-xs block mb-1">Jours</Label>
                                <div className="flex flex-wrap gap-1">
                                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                                    <Button
                                      key={day}
                                      type="button"
                                      variant={reminder.days.includes(day) ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => toggleReminderDay(reminder.id, day)}
                                    >
                                      {day}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor={`message-${reminder.id}`} className="text-xs">Message</Label>
                                <Input
                                  id={`message-${reminder.id}`}
                                  value={reminder.message}
                                  onChange={(e) => updateReminder(reminder.id, 'message', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-blue-600" />
                      Fonctionnement des rappels
                    </h4>
                    <p className="text-xs text-blue-700">
                      Les rappels sont envoyés par notification du navigateur. Ils ne fonctionnent que lorsque le navigateur est ouvert et que vous avez autorisé les notifications. Pour une expérience optimale, nous vous recommandons d'installer T-Cardio AI en tant qu'application depuis votre navigateur.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
