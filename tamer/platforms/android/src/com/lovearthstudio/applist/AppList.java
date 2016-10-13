//閸欏倽锟藉喛绱癶ttp://blog.csdn.net/lancees/article/details/7616735
//閸欏倽锟藉喛绱癶ttp://grokbase.com/t/gg/tasker/151nst55me/about-java-cell-ids-lac-mcc-mnc-gsm-cdma-lte-wcdma-and-all-that-funny-stuff-how-to-brew-your-own
//http://blog.csdn.net/andoop/article/details/50593699
//http://developer.android.com/reference/android/app/usage/UsageStatsManager.html


package com.lovearthstudio.applist;
import org.apache.cordova.CallbackContext;  
import org.apache.cordova.CordovaPlugin;  
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException; 
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import android.content.pm.PackageManager;
import android.content.pm.PackageInfo;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.BitmapDrawable;
import java.io.ByteArrayOutputStream;
import android.util.Base64;
import android.os.Build;
import android.app.usage.UsageStats;
import android.content.Intent;
import android.provider.Settings;
//import static android.Manifest.permission.PACKAGE_USAGE_STATS;

public class AppList extends CordovaPlugin {
	public static final String ACTION_APPLIST = "getAppList";
	public static final String ACTION_APPSTATS = "getAppStats";

	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		if (ACTION_APPLIST.equals(action)) {
			PackageManager pm=(PackageManager) cordova.getActivity().getPackageManager();
			List<PackageInfo> ps = pm.getInstalledPackages(0);					
			JSONArray ja = new JSONArray();

            for (PackageInfo p : ps) {
					JSONObject jo=new JSONObject();
					String aname=p.applicationInfo.loadLabel(pm).toString();
					jo.put("aname",aname==null?"na":aname);
//					Bitmap bitmap=((BitmapDrawable)p.applicationInfo.loadIcon(pm)).getBitmap();
//					jo.put("icon",encodeToBase64(bitmap)); //鏉╂瑤閲滄禒锝囩垳閸欘垯浜掑銉ょ稊閿涘奔绲鹃弰顖氭禈閻楀洦鏆熼幑顕�鍣烘径顏勩亣
					jo.put("pname",p.packageName);
					jo.put("version",p.versionName==null?"na":p.versionName);
					jo.put("code",p.versionCode);
					jo.put("system",((p.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 1)?1:0);
					ja.put(jo);
            }
			callbackContext.success(ja);
			return true;
		}else if (ACTION_APPSTATS.equals(action))  {

	    	 JSONArray ja = new JSONArray();
			 if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP){     //OS>5.1   API 21

				 long startTime=Long.parseLong(args.getString(0));
				 long endTime=Long.parseLong(args.getString(1));
				 int type=Integer.parseInt(args.getString(2));
	
				 
				 List<UsageStats> usageStatsList=AppStats.getUsageStatsList(cordova.getActivity(),startTime,endTime,type);			 				 

				 if (usageStatsList.isEmpty()){
//			            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
//			            cordova.getActivity().startActivity(intent);
			            callbackContext.error("maybe you have not PACKAGE_USAGE_STATS permission");
			            return true;
			     }else{			    	 
			            for (UsageStats app : usageStatsList) {
								JSONObject jo=new JSONObject();												
								jo.put("pname",app.getPackageName());
								jo.put("fts",app.getFirstTimeStamp());
								jo.put("lts",app.getLastTimeStamp());
								jo.put("ltu",app.getLastTimeUsed());
								jo.put("ttf",app.getTotalTimeInForeground());
								jo.put("cnt",-1);
								ja.put(jo);
			            }		
			            callbackContext.success(ja);
			            return true;
			     }
				 
			 }else{
				 callbackContext.error("only support android 5.1+");
				 return true;
			 }
		}else{
			callbackContext.error("failure");
			return false;			
		}
	}

	public static String encodeToBase64(Bitmap image)
	{
		Bitmap immagex=Bitmap.createScaledBitmap(image, 16, 16, false);
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream();  
		immagex.compress(Bitmap.CompressFormat.JPEG, 75/*ignored for PNG*/, baos);
		byte[] b = baos.toByteArray();
		String imageEncoded	= Base64.encodeToString(b,Base64.DEFAULT);
		return imageEncoded;
	}
	public static Bitmap decodeBase64(String input)	
	{
		byte[] decodedByte = Base64.decode(input, 0);
		return BitmapFactory.decodeByteArray(decodedByte, 0, decodedByte.length); 
	}
}