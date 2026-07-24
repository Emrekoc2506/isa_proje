import { Editor } from '@tinymce/tinymce-react';

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Admin paneli için TinyMCE Rich Text Editor bileşeni.
 *
 * Props:
 *  - value: string   HTML içeriği (description state)
 *  - onChange: (html: string) => void
 *  - placeholder: string (opsiyonel)
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Ürün açıklamasını buraya yazın...' }) {

  /**
   * TinyMCE görsel yükleme handler'ı.
   * Editörden gelen dosyayı doğrudan /api/admin/files/upload endpoint'ine gönderir.
   * Token localStorage'dan okunur — mevcut apiClient.js mantığı ile aynı.
   */
  const handleImageUpload = async (blobInfo) => {
    const formData = new FormData();
    formData.append('File', blobInfo.blob(), blobInfo.filename());
    formData.append('Purpose', 'Product');

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await fetch(`${API_BASE}/admin/files/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Görsel yüklenemedi');
    }

    const data = await response.json();
    return data.url; // FileUploadResponse.url
  };

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Editor
        apiKey={TINYMCE_API_KEY}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 460,
          menubar: true,
          skin: 'oxide-dark',
          content_css: 'dark',
          placeholder,
          plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'link', 'lists',
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
            'image', 'quickbars', 'emoticons'
          ],
          toolbar:
            'undo redo | styles | bold italic underline strikethrough | ' +
            'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image media table | ' +
            'emoticons charmap | removeformat | wordcount',
          toolbar_mode: 'wrap',

          // Görsel yükleme
          images_upload_handler: handleImageUpload,
          automatic_uploads: true,
          file_picker_types: 'image',
          image_advtab: true,
          image_caption: true,
          image_class_list: [
            { title: 'Tam Genişlik', value: 'rte-full' },
            { title: 'Ortalanmış', value: 'rte-center' },
            { title: 'Sola Hizalı', value: 'rte-left' },
            { title: 'Sağa Hizalı', value: 'rte-right' },
          ],

          // Video embed (YouTube, Vimeo, MP4 iframe)
          media_live_embeds: true,
          media_alt_source: false,
          media_poster: false,

          // Güvenlik — relative URL dönüşümü engelle
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,

          // iframe embed (YouTube) için genişletilmiş elementler
          extended_valid_elements:
            'iframe[src|width|height|frameborder|allow|allowfullscreen|title|style|class]',

          // Editör içi görünüm — koyu tema
          content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 15px;
              line-height: 1.75;
              color: #e8e0f0;
              background: #12091f;
              padding: 16px 22px;
              margin: 0;
            }
            h1, h2, h3, h4, h5 { color: #f5d680; margin: 1.3em 0 0.5em; font-weight: 700; }
            h1 { font-size: 1.9em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.2em; }
            p { margin: 0 0 1em; }
            a { color: #c9a227; }
            img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
            img.rte-full    { width: 100%; }
            img.rte-center  { margin: 0 auto; }
            img.rte-left    { float: left; margin: 0 14px 6px 0; max-width: 50%; }
            img.rte-right   { float: right; margin: 0 0 6px 14px; max-width: 50%; }
            .mce-preview-object iframe, video { max-width: 100%; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
            table td, table th { border: 1px solid rgba(255,255,255,0.15); padding: 8px 12px; }
            table th { background: rgba(201,162,39,0.12); color: #f5d680; }
            ul, ol { padding-left: 1.6em; margin-bottom: 1em; }
            blockquote {
              border-left: 3px solid #c9a227;
              margin: 1.2em 0;
              padding: 0.5em 1em;
              color: #b0a0c0;
              font-style: italic;
              background: rgba(255,255,255,0.02);
              border-radius: 0 6px 6px 0;
            }
            pre, code { background: rgba(255,255,255,0.06); border-radius: 5px; padding: 2px 6px; font-size: 13px; }
          `,

          // Hızlı erişim menüsü
          quickbars_selection_toolbar: 'bold italic | quicklink | blockquote',
          quickbars_image_toolbar:
            'alignleft aligncenter alignright | rotateleft rotateright | flipv fliph | imageoptions',
        }}
      />
    </div>
  );
}
