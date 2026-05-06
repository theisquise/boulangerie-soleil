module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });

  eleventyConfig.addCollection("products", function(api) {
    return api.getFilteredByGlob("src/products/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  eleventyConfig.addCollection("formations", function(api) {
    return api.getFilteredByGlob("src/formations/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  eleventyConfig.addFilter("activePromos", function(promos) {
    if (!promos) return [];
    const now = new Date();
    return promos.filter(p => {
      if (!p.active) return false;
      if (p.start && new Date(p.start) > now) return false;
      if (p.end && new Date(p.end) < now) return false;
      return true;
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
