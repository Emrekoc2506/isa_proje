import { Editor } from '@tinymce/tinymce-react';
import { uploadFile } from '../../services/fileApi';

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key';

/**
 * Admin paneli için TinyMCE Rich Text Editor bileşeni.
 *
 * Props:
 *  - value: string   HTML içeriği (description state)
 *  - onChange: (html: string) => void
 *  - placeholder: string (opsiyonel)
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Açıklamayı buraya yazın...' }) {

  /**
   * TinyMCE görsel yükleme handler'ı.
   * Editörden gelen dosyayı uploadFile servisi üzerinden /admin/files/upload endpoint'ine gönderir.
   */
  const handleImageUpload = async (blobInfo) => {
    try {
      const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
      const res = await uploadFile(file, 'Blog');
      return res.url || res.fileUrl || res.imageUrl || res.location || '';
    } catch (err) {
      throw new Error(err.message || 'Görsel yüklenemedi');
    }
  };

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Editor
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 460,
          menubar: true,
          skin: 'oxide-dark',
          content_css: 'dark',
          placeholder,
          plugins: [
            'anchor', 'autolink', 'charmap', 'codesample', 'code', 'link', 'lists',
            'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
            'image', 'quickbars', 'emoticons'
          ],
          toolbar:
            'undo redo | styles | bold italic underline strikethrough | ' +
            'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image media table | ' +
            'code emoticons charmap | removeformat | wordcount',
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

          // Video embed (YouTube, Vimeo, Google Drive)
          media_live_embeds: true,
          media_alt_source: false,
          media_poster: false,
          media_url_resolver: (data, resolve) => {
            if (data.url && data.url.includes('drive.google.com')) {
              let driveId = '';
              if (data.url.includes('/file/d/')) {
                driveId = data.url.split('/file/d/')[1]?.split('/')[0]?.split('?')[0];
              }
              if (driveId) {
                const embedHtml = `<iframe src="https://drive.google.com/file/d/${driveId}/preview" width="100%" height="360" frameborder="0" allow="autoplay" allowfullscreen></iframe>`;
                resolve({ html: embedHtml });
                return;
              }
            }
            resolve({ html: '' });
          },

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
