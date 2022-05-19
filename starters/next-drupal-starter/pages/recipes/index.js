import { NextSeo } from "next-seo";
import { IMAGE_URL } from "../../lib/constants.js";
import {
  getCurrentLocaleStore,
  globalDrupalStateStores,
} from "../../lib/drupalStateContext";

import Link from "next/link";
import Image from "next/image";
import Layout from "../../components/layout";

export default function Recipes({ recipes, hrefLang }) {
  function RecipesList() {
    return (
      <section>
        {recipes ? (
          <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-screen-lg">
            {recipes?.map(
              ({
                id,
                title,
                field_media_image,
                field_recipe_category,
                path,
              }) => {
                const imgSrc =
                  field_media_image?.field_media_image?.uri?.url || "";
                return (
                  <Link
                    passHref
                    href={`/${path.langcode}${path.alias}`}
                    key={id}
                  >
                    <a>
                      <div className="flex flex-col rounded-lg shadow-lg overflow-hidden cursor-pointer border-2 hover:border-indigo-500">
                        <div className="flex-shrink-0 relative h-40">
                          {imgSrc !== "" ? (
                            <Image
                              src={IMAGE_URL + imgSrc}
                              layout="fill"
                              objectFit="cover"
                              alt={
                                field_media_image?.field_media_image
                                  ?.resourceIdObjMeta?.alt ||
                                field_media_image.field_media_image.filename
                              }
                            />
                          ) : (
                            <div className="bg-black">
                              <Image
                                src="/pantheon.png"
                                alt="Pantheon Logo"
                                width={324}
                                height={160}
                              />
                            </div>
                          )}
                        </div>
                        <h2 className="my-4 mx-6 text-xl leading-7 font-semibold text-gray-900">
                          {title} &rarr;
                        </h2>
                        <span className="text-right pb-2 pr-3 text-sm text-slate-400">
                          {field_recipe_category[0].name}
                        </span>
                      </div>
                    </a>
                  </Link>
                );
              }
            )}
          </div>
        ) : (
          <h2 className="text-xl text-center mt-14">No recipes found 🏜</h2>
        )}
      </section>
    );
  }
  return (
    <Layout>
      <NextSeo
        title="Decoupled Next Drupal Demo"
        description="Generated by create next app."
        languageAlternates={hrefLang || false}
      />
      <header className="prose text-2xl mx-auto mt-20">
        <h1 className="text-center mx-auto">Recipes</h1>
      </header>
      <RecipesList />
    </Layout>
  );
}

export async function getStaticProps(context) {
  const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
  const { locales, locale } = context;

  const hrefLang = locales.map((locale) => {
    return {
      hrefLang: locale,
      href: origin + "/" + locale,
    };
  });

  const store = getCurrentLocaleStore(locale, globalDrupalStateStores);

  store.params.clear();
  store.params.addInclude([
    "field_media_image.field_media_image",
    "field_recipe_category",
  ]);

  try {
    const recipes = await store.getObject({
      objectName: "node--recipe",
      query: `{
        id
        title
        field_media_image
        field_recipe_category
        path
      }`,
    });


    return {
      props: {
        recipes,
        hrefLang,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Unable to fetch recipes: ", error);
    return {
      props: {},
    };
  }
}
