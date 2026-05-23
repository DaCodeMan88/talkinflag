// Sanity Studio schema — use this when setting up studio/
// Run: npx sanity@latest init --template blog --project YOUR_PROJECT_ID --dataset production --output-path studio

export default {
  name: "post",
  title: "Blog Post",
  type: "document",
  fields: [
    { name: "title", type: "string", title: "Title" },
    { name: "slug", type: "slug", title: "Slug", options: { source: "title" } },
    { name: "publishedAt", type: "datetime", title: "Published At" },
    { name: "author", type: "string", title: "Author" },
    {
      name: "category", type: "string", title: "Category",
      options: {
        list: ["College", "International", "Youth", "Women's Flag", "Mental Performance", "Training", "News"],
      },
    },
    { name: "excerpt", type: "text", title: "Excerpt", rows: 3 },
    { name: "mainImage", type: "image", title: "Main Image", options: { hotspot: true } },
    {
      name: "body", type: "array", title: "Body",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    },
  ],
};
