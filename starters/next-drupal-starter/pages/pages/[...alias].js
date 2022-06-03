import { NextSeo } from "next-seo";
import { isMultiLanguage } from "../../lib/isMultiLanguage";
import {
  getCurrentLocaleStore,
  globalDrupalStateAuthStores,
} from "../../lib/drupalStateContext";
import { getPreview } from "../../lib/getPreview";

import Link from "next/link";
import Layout from "../../components/layout";

export default function PageTemplate({ page, hrefLang }) {
  return (
    <Layout>
      <NextSeo
        title="Decoupled Next Drupal Demo"
        description="Generated by create next app."
        languageAlternates={hrefLang}
      />
      <article className="prose lg:prose-xl mt-10 mx-auto">
        <h1>{page.title}</h1>

        <Link passHref href="/pages">
          <a className="font-normal">Pages &rarr;</a>
        </Link>

        <div className="mt-12 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-screen-lg">
          <div dangerouslySetInnerHTML={{ __html: page.body.value }} />
        </div>
      </article>
    </Layout>
  );
}

export async function getStaticPaths(context) {
  const multiLanguage = isMultiLanguage(context.locales);
  // TODO - locale increases the complexity enough here that creating a usePaths
  // hook would be a good idea.
  // Get paths for each locale.
  const pathsByLocale = context.locales.map(async (locale) => {
    const store = getCurrentLocaleStore(locale, globalDrupalStateAuthStores);

    // clear params in case they pollute call to get node--page
    store.params.clear();

    const pages = await store.getObject({
      objectName: "node--page",
      query: `
        {
          id
          path {
            alias
          }
        }
      `,
    });
    return pages.map((page) => {
      const match = page.path.alias.match(/^\/pages\/(.*)$/);
      const alias = match[1];

      return { params: { alias: [alias] }, locale: locale };
    });
  });
  // Resolve all promises returned as part of pathsByLocale.
  const paths = await Promise.all(pathsByLocale).then((values) => {
    // Flatten the array of arrays into a single array.
    return [].concat(...values);
  });

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps(context) {
  const { locales, locale } = context;
  const multiLanguage = isMultiLanguage(context.locales);
  const lang = context.preview ? context.previewData.previewLang : locale;
  const store = getCurrentLocaleStore(lang, globalDrupalStateAuthStores);

  const alias = `/pages/${context.params.alias[0]}`;

  store.params.clear();
  context.preview && (await getPreview(context, "node--page"));

  const page = await store.getObjectByPath({
    objectName: "node--page",
    path: `${multiLanguage ? lang : ""}${alias}`,
    query: `
        {
          id
          title
          body
          path {
            alias
            langcode
          }
        }
      `,
  });

  store.params.clear();

  const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
  // Load all the paths for the current page content type.
  const paths = locales.map(async (locale) => {
    const storeByLocales = getCurrentLocaleStore(
      locale,
      globalDrupalStateAuthStores
    );
    const { path } = await storeByLocales.getObject({
      objectName: "node--page",
      id: page.id,
    });
    return path;
  });

  // Resolve all promises returned as part of paths
  // and prepare hrefLang.
  const hrefLang = await Promise.all(paths).then((values) => {
    return values.map((value) => {
      return {
        hrefLang: value.langcode,
        href: origin + "/" + value.langcode + value.alias,
      };
    });
  });

  return {
    props: {
      page,
      hrefLang,
      revalidate: 60,
    },
  };
}
