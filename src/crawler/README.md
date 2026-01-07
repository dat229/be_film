# Crawler Service

Service để crawl dữ liệu phim từ các website và lưu vào database.

## Cách sử dụng

### 1. Chạy crawler script độc lập

```bash
npm run crawl
```

Hoặc:

```bash
ts-node -r tsconfig-paths/register src/crawler/crawler.script.ts
```

### 2. Customize crawler

Để crawl từ một website cụ thể, bạn cần:

1. **Sửa hàm `crawlFromUrl()` trong `crawler.service.ts`**:
   - Parse HTML theo cấu trúc của website bạn muốn crawl
   - Extract các thông tin: title, description, poster, year, rating, categories, actors, links

2. **Thêm URLs vào `crawler.script.ts`**:
   ```typescript
   const urlsToCrawl = [
     'https://example.com/film/1',
     'https://example.com/film/2',
     // ...
   ];
   ```

3. **Hoặc customize scheduler** trong `scheduler.service.ts` để tự động crawl định kỳ

## Ví dụ parse HTML

```typescript
async crawlFromUrl(url: string) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Ví dụ parse
  const title = $('h1.title').text().trim();
  const description = $('.description').text().trim();
  const poster = $('.poster img').attr('src');
  const year = parseInt($('.year').text()) || undefined;
  
  // Extract categories
  const categories: string[] = [];
  $('.categories a').each((_, el) => {
    categories.push($(el).text().trim());
  });

  // Extract video links
  const linkM3u8 = $('[data-type="m3u8"]').attr('data-url');
  const linkWebview = $('[data-type="webview"]').attr('data-url');

  await this.crawlAndSaveFilm({
    title,
    description,
    poster,
    year,
    linkM3u8,
    linkWebview,
    categories,
  });
}
```

## Lưu ý

- Thêm delay giữa các request để tránh bị block
- Sử dụng User-Agent hợp lệ
- Xử lý lỗi và retry logic
- Validate dữ liệu trước khi lưu vào DB













