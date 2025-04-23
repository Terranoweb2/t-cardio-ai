"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Heart,
  Building,
  Calendar,
  Edit,
  Save,
  Stethoscope,
} from "lucide-react";

interface DoctorInfo {
  id: string;
  name: string;
  speciality: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor";
  birthdate?: string;
  phone?: string;
  address?: string;
  medicalInfo?: string;
  allergies?: string;
  medications?: string;
  doctor?: DoctorInfo;
}

type EditableUserProfile = UserProfile;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableUserProfile | null>(null);

  // Chargement des données utilisateur depuis le localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser) as UserProfile;
        setUser(userData);
        setFormData(userData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;

    const { name, value } = e.target;

    // Gérer les champs imbriqués (pour les informations du médecin)
    if (name.startsWith("doctor.")) {
      const doctorField = name.split(".")[1] as keyof DoctorInfo;
      const updatedDoctor: DoctorInfo = {
        id: formData.doctor?.id || "doc-temp",
        name: formData.doctor?.name || "",
        speciality: formData.doctor?.speciality || "",
        phone: formData.doctor?.phone || "",
        email: formData.doctor?.email || "",
        address: formData.doctor?.address || "",
        ...(formData.doctor || {}),
        [doctorField]: value,
      };

      setFormData({
        ...formData,
        doctor: updatedDoctor,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    localStorage.setItem("user", JSON.stringify(formData));
    setUser(formData);
    setIsEditing(false);

    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${user.name}`}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isEditing) {
                  // On entre en mode édition, on prend le dernier user à jour
                  setFormData(user);
                }
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium flex items-center"
                    >
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      Nom complet
                    </label>
                    {isEditing ? (
                      <Input
                        id="name"
                        name="name"
                        value={formData?.name || ""}
                        onChange={handleInputChange}
                        placeholder="Votre nom complet"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                        {user.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium flex items-center"
                    >
                      <Mail className="mr-2 h-4 w-4 text-gray-500" />
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData?.email || ""}
                        onChange={handleInputChange}
                        placeholder="Votre adresse email"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium flex items-center"
                    >
                      <Phone className="mr-2 h-4 w-4 text-gray-500" />
                      Téléphone
                    </label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        name="phone"
                        value={formData?.phone || ""}
                        onChange={handleInputChange}
                        placeholder="Votre numéro de téléphone"
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                        {user.phone || "Non renseigné"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="birthdate"
                      className="text-sm font-medium flex items-center"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      Date de naissance
                    </label>
                    {isEditing ? (
                      <Input
                        id="birthdate"
                        name="birthdate"
                        type="date"
                        value={formData?.birthdate || ""}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                        {user.birthdate || "Non renseignée"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label
                      htmlFor="address"
                      className="text-sm font-medium flex items-center"
                    >
                      <Building className="mr-2 h-4 w-4 text-gray-500" />
                      Adresse
                    </label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        name="address"
                        value={formData?.address || ""}
                        onChange={handleInputChange}
                        placeholder="Votre adresse complète"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                        {user.address || "Non renseignée"}
                      </p>
                    )}
                  </div>
                </div>

                {user.role === "patient" && (
                  <>
                    <div className="border-t pt-6 mt-6">
                      <h3 className="font-medium mb-4 flex items-center">
                        <Heart className="mr-2 h-5 w-5 text-red-500" />
                        Informations médicales
                      </h3>
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                          <label
                            htmlFor="medicalInfo"
                            className="text-sm font-medium"
                          >
                            Antécédents médicaux
                          </label>
                          {isEditing ? (
                            <Textarea
                              id="medicalInfo"
                              name="medicalInfo"
                              value={formData?.medicalInfo || ""}
                              onChange={handleInputChange}
                              placeholder="Vos antécédents médicaux..."
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.medicalInfo ||
                                "Aucun antécédent renseigné"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="allergies"
                            className="text-sm font-medium"
                          >
                            Allergies
                          </label>
                          {isEditing ? (
                            <Textarea
                              id="allergies"
                              name="allergies"
                              value={formData?.allergies || ""}
                              onChange={handleInputChange}
                              placeholder="Vos allergies..."
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.allergies ||
                                "Aucune allergie renseignée"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="medications"
                            className="text-sm font-medium"
                          >
                            Médicaments actuels
                          </label>
                          {isEditing ? (
                            <Textarea
                              id="medications"
                              name="medications"
                              value={formData?.medications || ""}
                              onChange={handleInputChange}
                              placeholder="Vos médicaments..."
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.medications ||
                                "Aucun médicament renseigné"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                      <h3 className="font-medium mb-4 flex items-center">
                        <Stethoscope className="mr-2 h-5 w-5 text-blue-500" />
                        Mon médecin traitant
                      </h3>
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-1">
                          <label
                            htmlFor="doctor.name"
                            className="text-sm font-medium"
                          >
                            Nom du médecin
                          </label>
                          {isEditing ? (
                            <Input
                              id="doctor.name"
                              name="doctor.name"
                              value={formData?.doctor?.name || ""}
                              onChange={handleInputChange}
                              placeholder="Nom de votre médecin"
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.doctor?.name || "Non renseigné"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="doctor.speciality"
                            className="text-sm font-medium"
                          >
                            Spécialité
                          </label>
                          {isEditing ? (
                            <Input
                              id="doctor.speciality"
                              name="doctor.speciality"
                              value={formData?.doctor?.speciality || ""}
                              onChange={handleInputChange}
                              placeholder="Spécialité de votre médecin"
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.doctor?.speciality ||
                                "Non renseignée"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="doctor.email"
                            className="text-sm font-medium"
                          >
                            Email du médecin
                          </label>
                          {isEditing ? (
                            <Input
                              id="doctor.email"
                              name="doctor.email"
                              type="email"
                              value={formData?.doctor?.email || ""}
                              onChange={handleInputChange}
                              placeholder="Email de votre médecin"
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.doctor?.email || "Non renseigné"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="doctor.phone"
                            className="text-sm font-medium"
                          >
                            Téléphone du médecin
                          </label>
                          {isEditing ? (
                            <Input
                              id="doctor.phone"
                              name="doctor.phone"
                              value={formData?.doctor?.phone || ""}
                              onChange={handleInputChange}
                              placeholder="Téléphone de votre médecin"
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.doctor?.phone || "Non renseigné"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label
                            htmlFor="doctor.address"
                            className="text-sm font-medium"
                          >
                            Adresse du cabinet
                          </label>
                          {isEditing ? (
                            <Textarea
                              id="doctor.address"
                              name="doctor.address"
                              value={formData?.doctor?.address || ""}
                              onChange={handleInputChange}
                              placeholder="Adresse du cabinet de votre médecin"
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm py-2 px-3 rounded-md bg-gray-50">
                              {user.doctor?.address ||
                                "Non renseignée"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
