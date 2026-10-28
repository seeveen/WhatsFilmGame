import { EventEmitter } from 'node:events';
import { TikTokLiveConnection } from 'tiktok-live-connector';

export interface TikTokChatPayload {
  uniqueId: string;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
  timestamp: number;
}

export interface TikTokGiftPayload {
  uniqueId: string;
  nickname: string;
  giftId: number | string;
  giftName: string;
  repeatCount: number;
  profilePictureUrl?: string;
  timestamp: number;
}

export interface TikTokLikePayload {
  uniqueId: string;
  nickname: string;
  likeCount: number;
  timestamp: number;
}

export interface TikTokSocialPayload {
  uniqueId: string;
  nickname: string;
  timestamp: number;
}

export class TikTokService extends EventEmitter {
  private connector: any = null;
  private currentUsername: string = '';
  private isConnecting: boolean = false;
  private connectionError: string | undefined = undefined;
  private viewerCount: number | undefined = undefined;

  public getStatus(): {
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    username: string;
    viewerCount?: number;
    errorMsg?: string;
  } {
    let status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
    if (this.connectionError) {
      status = 'error';
    } else if (this.isConnecting) {
      status = 'connecting';
    } else if (this.connector?.isConnected()) {
      status = 'connected';
    }

    return {
      status,
      username: this.currentUsername,
      viewerCount: this.viewerCount,
      errorMsg: this.connectionError,
    };
  }

  public async connect(username: string): Promise<{ success: boolean; message: string }> {
    if (typeof username !== 'string') {
      return { success: false, message: 'Nome de usuário do TikTok é obrigatório.' };
    }
    const cleanUser = username.replace(/^@/, '').trim();
    if (!cleanUser) {
      return { success: false, message: 'Nome de usuário do TikTok é obrigatório.' };
    }

    if (this.connector) {
      await this.disconnect();
    }

    this.currentUsername = cleanUser;
    this.isConnecting = true;
    this.connectionError = undefined;
    this.viewerCount = undefined;
    this.emit('status_change', { status: 'connecting', username: cleanUser });

    try {
      this.connector = new TikTokLiveConnection(cleanUser, {
        processInitialData: false,
      });

      this.connector.on('connected', (state: any) => {
        this.isConnecting = false;
        this.viewerCount = state?.roomInfo?.viewer_count;
        this.emit('status_change', {
          status: 'connected',
          username: cleanUser,
          viewerCount: state?.roomInfo?.viewer_count,
        });
        this.emit('log', `Conectado à LIVE de @${cleanUser}`);
      });

      this.connector.on('roomUser', (data: any) => {
        if (this.viewerCount === data?.viewerCount) return;
        this.viewerCount = data?.viewerCount;
        this.emit('status_change', this.getStatus());
      });

      this.connector.on('disconnected', () => {
        this.isConnecting = false;
        this.connectionError = undefined;
        this.viewerCount = undefined;
        this.emit('status_change', { status: 'disconnected', username: cleanUser });
        this.emit('log', `Desconectado da LIVE de @${cleanUser}`);
      });

      this.connector.on('error', (err: any) => {
        this.isConnecting = false;
        const msg = err?.message || String(err);
        this.connectionError = msg;
        this.emit('status_change', { status: 'error', username: cleanUser, errorMsg: msg });
        this.emit('log', `Erro na conexão TikTok LIVE: ${msg}`);
      });

      this.connector.on('chat', (data: any) => {
        const user = data.user;
        const payload: TikTokChatPayload = {
          uniqueId: String(user?.uniqueId || user?.userId || user?.nickname || 'espectador'),
          nickname: user?.nickname || user?.uniqueId || 'Espectador',
          comment: data.comment || '',
          profilePictureUrl: user?.profilePictureUrl,
          timestamp: Date.now(),
        };
        this.emit('chat', payload);
      });

      this.connector.on('gift', (data: any) => {
        if (data.giftDetails?.giftType === 1 && !data.repeatEnd) return;

        const user = data.user;
        const payload: TikTokGiftPayload = {
          uniqueId: String(user?.uniqueId || user?.userId || user?.nickname || 'espectador'),
          nickname: user?.nickname || user?.uniqueId || 'Espectador',
          giftId: data.giftId ?? 'gift',
          giftName: data.giftDetails?.giftName || 'Presente',
          repeatCount: data.repeatCount || 1,
          profilePictureUrl: user?.profilePictureUrl,
          timestamp: Date.now(),
        };
        this.emit('gift', payload);
      });

      this.connector.on('like', (data: any) => {
        const user = data.user;
        const payload: TikTokLikePayload = {
          uniqueId: String(user?.uniqueId || user?.userId || user?.nickname || 'espectador'),
          nickname: user?.nickname || user?.uniqueId || 'Espectador',
          likeCount: Math.max(1, Number(data.likeCount) || 1),
          timestamp: Date.now(),
        };
        this.emit('like', payload);
      });

      for (const eventName of ['follow', 'share'] as const) {
        this.connector.on(eventName, (data: any) => {
          const user = data.user;
          const payload: TikTokSocialPayload = {
            uniqueId: String(user?.uniqueId || user?.userId || user?.nickname || 'espectador'),
            nickname: user?.nickname || user?.uniqueId || 'Espectador',
            timestamp: Date.now(),
          };
          this.emit(eventName, payload);
        });
      }
      await this.connector.connect();
      return { success: true, message: `Conectando à LIVE de @${cleanUser}...` };
    } catch (err: any) {
      this.isConnecting = false;
      const errorMsg = err?.message || 'Falha ao conectar à LIVE do TikTok. Verifique se o usuário está online.';
      this.connectionError = errorMsg;
      this.emit('status_change', { status: 'error', username: cleanUser, errorMsg });
      return { success: false, message: errorMsg };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connector) {
      try {
        await this.connector.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.connector = null;
    }
    this.isConnecting = false;
    this.connectionError = undefined;
    this.viewerCount = undefined;
    this.emit('status_change', { status: 'disconnected', username: this.currentUsername });
  }

  // --- Test Simulator for Local Demo & Verification ---
  public simulateChat(username: string, comment: string, profilePictureUrl?: string) {
    const cleanUser = username.replace(/^@/, '').trim() || 'participante';
    const payload: TikTokChatPayload = {
      uniqueId: cleanUser.toLowerCase(),
      nickname: cleanUser,
      comment,
      profilePictureUrl,
      timestamp: Date.now(),
    };
    this.emit('chat', payload);
  }

  public simulateGift(
    username: string,
    giftName: string,
    repeatCount: number = 1,
    giftId?: string | number,
    profilePictureUrl?: string
  ) {
    const cleanUser = username.replace(/^@/, '').trim() || 'apoiador';
    const payload: TikTokGiftPayload = {
      uniqueId: cleanUser.toLowerCase(),
      nickname: cleanUser,
      giftId: giftId !== undefined ? String(giftId) : giftName.toLowerCase().replace(/\s+/g, '_'),
      giftName,
      repeatCount,
      profilePictureUrl,
      timestamp: Date.now(),
    };
    this.emit('gift', payload);
  }
}
