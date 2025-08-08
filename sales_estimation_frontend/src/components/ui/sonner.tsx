"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-secondary-foreground group-[.toaster]:border-secondary group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-secondary dark:group-[.toaster]:text-secondary-foreground dark:group-[.toaster]:border-accent",
          description: "group-[.toast]:text-muted-foreground dark:group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground dark:group-[.toast]:bg-primary dark:group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground dark:group-[.toast]:bg-accent dark:group-[.toast]:text-accent-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
