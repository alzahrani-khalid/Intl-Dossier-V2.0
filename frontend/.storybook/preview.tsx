import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const direction = context.globals.locale === "ar" ? "rtl" : "ltr";
      
      useEffect(() => {
        document.dir = direction;
        i18n.changeLanguage(context.globals.locale);
      }, [context.globals.locale]);
      
      return (
        <I18nextProvider i18n={i18n}>
          <div dir={direction}>
            <Story />
          </div>
        </I18nextProvider>
      );
    },
  ],
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "ar", title: "العربية" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
};

export default preview;