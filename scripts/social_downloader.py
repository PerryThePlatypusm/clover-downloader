#!/usr/bin/env python3
import sys
import os
import json
import re
import urllib.parse

def clean_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', '', name).strip()
    return cleaned[:100] if cleaned else 'media_download'

def handle_pornhub(url: str, mode: str, format_type: str, quality: str, output_dir: str, requested_title: str = None):
    import subprocess
    if mode == 'info':
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--impersonate', 'chrome',
            '--dump-json',
            '--no-warnings',
            url
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
        for line in res.stdout.strip().split('\n'):
            line = line.strip()
            if line.startswith('{') and line.endswith('}'):
                try:
                    data = json.loads(line)
                    return {
                        'success': True,
                        'title': data.get('title') or requested_title or 'PornHub Video',
                        'author': data.get('uploader') or data.get('channel') or 'PornHub Model',
                        'thumbnail': data.get('thumbnail') or '',
                        'duration': data.get('duration_string') or '',
                        'platform': 'phub'
                    }
                except Exception:
                    pass
        return {'success': False, 'error': 'Could not extract PornHub info'}

    elif mode == 'download':
        out_tmpl = os.path.join(output_dir, 'phub_%(id)s_%(resolution)s.%(ext)s')
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--impersonate', 'chrome',
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--no-part',
            '--no-warnings',
            '-o', out_tmpl,
            url
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        # Find the newly downloaded file
        files = [f for f in os.listdir(output_dir) if f.startswith('phub_')]
        if files:
            # Sort by mtime descending
            files.sort(key=lambda f: os.path.getmtime(os.path.join(output_dir, f)), reverse=True)
            chosen = files[0]
            full_path = os.path.join(output_dir, chosen)
            size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 1)
            ext = os.path.splitext(chosen)[1].replace('.', '') or format_type
            title = requested_title or chosen
            safe_title = clean_filename(title)
            final_name = f"{safe_title}.{ext}"
            return {
                'success': True,
                'localFile': chosen,
                'filename': final_name,
                'title': title,
                'sizeMB': size_mb
            }
        return {'success': False, 'error': f"PornHub download failed: {res.stderr[:200]}"}

def handle_instagram(url: str, mode: str, format_type: str, quality: str, output_dir: str, requested_title: str = None):
    import parth_dl
    if mode == 'info':
        try:
            info = parth_dl.get_info(url)
            title = info.get('caption') or requested_title or f"Instagram Post by {info.get('owner_username', 'User')}"
            return {
                'success': True,
                'title': title[:120],
                'author': info.get('owner_username') or 'Instagram User',
                'thumbnail': info.get('display_url') or '',
                'platform': 'instagram'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    elif mode == 'download':
        try:
            out = parth_dl.download(url, output_path=output_dir)
            # out can be single file path or list
            downloaded_path = out[0] if isinstance(out, list) else out
            if downloaded_path and os.path.exists(downloaded_path):
                local_file = os.path.basename(downloaded_path)
                size_mb = round(os.path.getsize(downloaded_path) / (1024 * 1024), 1)
                ext = os.path.splitext(local_file)[1].replace('.', '') or 'mp4'
                title = requested_title or clean_filename(local_file)
                safe_title = clean_filename(title)
                return {
                    'success': True,
                    'localFile': local_file,
                    'filename': f"{safe_title}.{ext}",
                    'title': title,
                    'sizeMB': size_mb
                }
        except Exception as e:
            # Fallback to yt-dlp impersonated
            pass

        import subprocess
        out_tmpl = os.path.join(output_dir, 'ig_%(id)s.%(ext)s')
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--impersonate', 'chrome',
            '-f', 'best',
            '--no-part',
            '-o', out_tmpl,
            url
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        files = [f for f in os.listdir(output_dir) if f.startswith('ig_')]
        if files:
            files.sort(key=lambda f: os.path.getmtime(os.path.join(output_dir, f)), reverse=True)
            chosen = files[0]
            full_path = os.path.join(output_dir, chosen)
            size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 1)
            ext = os.path.splitext(chosen)[1].replace('.', '') or 'mp4'
            title = requested_title or 'Instagram Reel'
            return {
                'success': True,
                'localFile': chosen,
                'filename': f"{clean_filename(title)}.{ext}",
                'title': title,
                'sizeMB': size_mb
            }
        return {'success': False, 'error': 'Could not download Instagram media'}

def handle_twitter(url: str, mode: str, format_type: str, quality: str, output_dir: str, requested_title: str = None):
    # Try twitsave via curl_cffi
    try:
        from curl_cffi import requests
        from bs4 import BeautifulSoup
        clean_url = url.split('?')[0]
        ts_url = f"https://twitsave.com/info?url={urllib.parse.quote(clean_url)}"
        r = requests.get(ts_url, impersonate='chrome', timeout=15)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            # Extract title / text
            p_text = soup.find('p', {'class': 'm-2'})
            tweet_text = p_text.get_text(strip=True) if p_text else (requested_title or 'X Video')
            author_span = soup.find('h2')
            author = author_span.get_text(strip=True) if author_span else 'X User'

            # Find download links
            video_links = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                if 'video.twimg.com' in href or 'twitsave.com/download' in href:
                    video_links.append(href)

            if mode == 'info':
                return {
                    'success': True,
                    'title': tweet_text[:120],
                    'author': author,
                    'platform': 'twitter'
                }

            if mode == 'download' and video_links:
                direct_video_url = video_links[0]
                dl_res = requests.get(direct_video_url, impersonate='chrome', timeout=60)
                if dl_res.status_code == 200:
                    ext = format_type.lower()
                    local_id = f"tw_{int(os.times().elapsed * 1000)}"
                    local_file = f"{local_id}.{ext}"
                    out_path = os.path.join(output_dir, local_file)
                    with open(out_path, 'wb') as f:
                        f.write(dl_res.content)
                    size_mb = round(os.path.getsize(out_path) / (1024 * 1024), 1)
                    safe_title = clean_filename(tweet_text)
                    return {
                        'success': True,
                        'localFile': local_file,
                        'filename': f"{safe_title}.{ext}",
                        'title': tweet_text,
                        'sizeMB': size_mb
                    }
    except Exception as e:
        pass

    # Fallback to yt-dlp
    import subprocess
    if mode == 'info':
        cmd = [sys.executable, '-m', 'yt_dlp', '--impersonate', 'chrome', '--dump-json', url]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=20)
        for line in res.stdout.strip().split('\n'):
            if line.startswith('{') and line.endswith('}'):
                try:
                    d = json.loads(line)
                    return {
                        'success': True,
                        'title': d.get('title') or requested_title or 'X Video',
                        'author': d.get('uploader') or 'X User',
                        'thumbnail': d.get('thumbnail') or '',
                        'platform': 'twitter'
                    }
                except Exception:
                    pass
        return {'success': False, 'error': 'Could not extract Twitter info'}

    elif mode == 'download':
        out_tmpl = os.path.join(output_dir, 'tw_%(id)s.%(ext)s')
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--impersonate', 'chrome',
            '-f', 'best',
            '--no-part',
            '-o', out_tmpl,
            url
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
        files = [f for f in os.listdir(output_dir) if f.startswith('tw_')]
        if files:
            files.sort(key=lambda f: os.path.getmtime(os.path.join(output_dir, f)), reverse=True)
            chosen = files[0]
            full_path = os.path.join(output_dir, chosen)
            size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 1)
            ext = os.path.splitext(chosen)[1].replace('.', '') or 'mp4'
            title = requested_title or 'X Video'
            return {
                'success': True,
                'localFile': chosen,
                'filename': f"{clean_filename(title)}.{ext}",
                'title': title,
                'sizeMB': size_mb
            }
        return {'success': False, 'error': 'Could not download Twitter media'}

def handle_generic_ytdlp(url: str, mode: str, format_type: str, quality: str, output_dir: str, requested_title: str = None):
    import subprocess
    if mode == 'info':
        cmd = [sys.executable, '-m', 'yt_dlp', '--impersonate', 'chrome', '--dump-json', url]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=25)
        for line in res.stdout.strip().split('\n'):
            if line.startswith('{') and line.endswith('}'):
                try:
                    d = json.loads(line)
                    return {
                        'success': True,
                        'title': d.get('title') or requested_title or 'Media Video',
                        'author': d.get('uploader') or d.get('channel') or 'Creator',
                        'thumbnail': d.get('thumbnail') or '',
                        'duration': d.get('duration_string') or '',
                        'platform': 'other'
                    }
                except Exception:
                    pass
        return {'success': False, 'error': 'Could not extract media info'}

    elif mode == 'download':
        prefix = 'generic_'
        out_tmpl = os.path.join(output_dir, f"{prefix}%(id)s.%(ext)s")
        is_audio = format_type.lower() in ['mp3', 'wav', 'flac', 'aac', 'opus', 'ogg', 'm4a']
        if is_audio:
            cmd = [
                sys.executable, '-m', 'yt_dlp',
                '--impersonate', 'chrome',
                '-f', 'bestaudio/best',
                '-x', '--audio-format', 'wav' if format_type.lower() == 'wav' else 'mp3',
                '--no-part',
                '-o', out_tmpl,
                url
            ]
        else:
            cmd = [
                sys.executable, '-m', 'yt_dlp',
                '--impersonate', 'chrome',
                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                '--no-part',
                '-o', out_tmpl,
                url
            ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=90)
        files = [f for f in os.listdir(output_dir) if f.startswith(prefix)]
        if files:
            files.sort(key=lambda f: os.path.getmtime(os.path.join(output_dir, f)), reverse=True)
            chosen = files[0]
            full_path = os.path.join(output_dir, chosen)
            size_mb = round(os.path.getsize(full_path) / (1024 * 1024), 1)
            ext = os.path.splitext(chosen)[1].replace('.', '') or format_type
            title = requested_title or 'Media Video'
            return {
                'success': True,
                'localFile': chosen,
                'filename': f"{clean_filename(title)}.{ext}",
                'title': title,
                'sizeMB': size_mb
            }
        return {'success': False, 'error': f"Universal download failed: {res.stderr[:200]}"}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'success': False, 'error': 'Insufficient arguments'}))
        sys.exit(1)

    command = sys.argv[1] # 'info' or 'download'
    url = sys.argv[2]
    format_type = sys.argv[3] if len(sys.argv) > 3 else 'mp4'
    quality = sys.argv[4] if len(sys.argv) > 4 else '1080p'
    output_dir = sys.argv[5] if len(sys.argv) > 5 else '/tmp/downloads'
    title = sys.argv[6] if len(sys.argv) > 6 else None

    os.makedirs(output_dir, exist_ok=True)
    lower_url = url.lower()

    if 'pornhub.com' in lower_url or 'phub' in lower_url:
        result = handle_pornhub(url, command, format_type, quality, output_dir, title)
    elif 'instagram.com' in lower_url:
        result = handle_instagram(url, command, format_type, quality, output_dir, title)
    elif 'twitter.com' in lower_url or 'x.com' in lower_url:
        result = handle_twitter(url, command, format_type, quality, output_dir, title)
    else:
        result = handle_generic_ytdlp(url, command, format_type, quality, output_dir, title)

    print(json.dumps(result))

if __name__ == '__main__':
    main()
