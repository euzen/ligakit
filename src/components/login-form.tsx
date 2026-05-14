"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError("");
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setServerError(t("invalidCredentials"));
        return;
      }
      toast.success(t("loginSuccess"));
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setServerError(t("invalidCredentials"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          className="rounded-xl border-slate-200 h-11"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{t("emailInvalid")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          disabled={isSubmitting}
          aria-invalid={!!errors.password}
          className="rounded-xl border-slate-200 h-11"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{t("fieldRequired")}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold shadow-md shadow-blue-100" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {t("loginButton")}
      </Button>
    </form>
  );
}
